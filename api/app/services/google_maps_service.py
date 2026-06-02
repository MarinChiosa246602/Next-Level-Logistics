import httpx
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class GoogleMapsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.cache = {}

    async def get_route(self, pickup_lat: float, pickup_lng: float, delivery_lat: float, delivery_lng: float) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("GOOGLE_MAPS_API_KEY not configured, returning mock data")
            return self._mock_route_data(pickup_lat, pickup_lng, delivery_lat, delivery_lng)

        cache_key = f"{pickup_lat},{pickup_lng}_{delivery_lat},{delivery_lng}"
        if cache_key in self.cache:
            cached_data, expires_at = self.cache[cache_key]
            if datetime.utcnow() < expires_at:
                logger.info(f"Returning cached route for {cache_key}")
                return cached_data

        try:
            url = f"{self.base_url}/directions/json"
            params = {
                "origin": f"{pickup_lat},{pickup_lng}",
                "destination": f"{delivery_lat},{delivery_lng}",
                "key": self.api_key,
                "mode": "driving"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code != 200:
                    logger.warning(f"Google Maps API returned {response.status_code}")
                    return self._mock_route_data(pickup_lat, pickup_lng, delivery_lat, delivery_lng)

                data = response.json()

                if data.get("status") != "OK":
                    logger.warning(f"Google Maps API status: {data.get('status')}")
                    return self._mock_route_data(pickup_lat, pickup_lng, delivery_lat, delivery_lng)

                route = data.get("routes", [{}])[0]
                leg = route.get("legs", [{}])[0]

                result = {
                    "distance_km": round(leg.get("distance", {}).get("value", 0) / 1000, 2),
                    "duration_minutes": leg.get("duration", {}).get("text", "Unknown"),
                    "polyline_encoded": route.get("overview_polyline", {}).get("points", ""),
                    "status": "success"
                }

                expires_at = datetime.utcnow() + timedelta(hours=1)
                self.cache[cache_key] = (result, expires_at)

                logger.info(f"Route calculated: {result['distance_km']}km, {result['duration_minutes']}")
                return result

        except Exception as e:
            logger.error(f"Error calculating route: {str(e)}", exc_info=True)
            return self._mock_route_data(pickup_lat, pickup_lng, delivery_lat, delivery_lng)

    async def geocode_address(self, address: str) -> Optional[Dict[str, float]]:
        if not self.api_key:
            logger.warning("GOOGLE_MAPS_API_KEY not configured for geocoding")
            return None

        cache_key = f"geo_{address}"
        if cache_key in self.cache:
            cached_data, expires_at = self.cache[cache_key]
            if datetime.utcnow() < expires_at:
                return cached_data

        try:
            url = f"{self.base_url}/geocode/json"
            params = {
                "address": address,
                "key": self.api_key
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code != 200:
                    logger.warning(f"Geocoding API returned {response.status_code}")
                    return None

                data = response.json()

                if data.get("status") != "OK" or not data.get("results"):
                    logger.warning(f"Geocoding failed: {data.get('status')}")
                    return None

                location = data["results"][0]["geometry"]["location"]
                result = {
                    "lat": location["lat"],
                    "lng": location["lng"]
                }

                expires_at = datetime.utcnow() + timedelta(days=7)
                self.cache[cache_key] = (result, expires_at)

                logger.info(f"Geocoded '{address}' to {result}")
                return result

        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}", exc_info=True)
            return None

    @staticmethod
    def _mock_route_data(pickup_lat: float, pickup_lng: float, delivery_lat: float, delivery_lng: float) -> Dict[str, Any]:
        import math
        distance = math.sqrt((delivery_lat - pickup_lat)**2 + (delivery_lng - pickup_lng)**2) * 111
        duration_minutes = int(distance * 1.2)

        return {
            "distance_km": round(distance, 2),
            "duration_minutes": f"{duration_minutes} mins",
            "polyline_encoded": "",
            "status": "mock"
        }

google_maps_service = GoogleMapsService()
