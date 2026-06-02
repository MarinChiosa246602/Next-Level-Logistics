// Google Maps utilities for frontend
export const googleMapsService = {
  // Get Waze navigation URL
  getWazeUrl: (startLat, startLng, endLat, endLng, destination) => {
    return `https://waze.com/ul?ll=${endLat},${endLng}&navigate=yes&q=${encodeURIComponent(destination || 'Destination')}`;
  },

  // Get Google Maps navigation URL
  getGoogleMapsUrl: (startLat, startLng, endLat, endLng) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`;
  },

  // Format distance and duration for display
  formatRouteInfo: (distance_km, duration_minutes) => {
    return {
      distanceText: `${distance_km} km`,
      durationText: duration_minutes || 'Unknown',
      displayText: `${distance_km} km • ${duration_minutes || 'Unknown duration'}`
    };
  },

  // Calculate rough distance using Haversine formula (for testing)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Estimate duration in minutes based on distance
  estimateDuration: (distanceKm) => {
    // Assume average speed of 60 km/h in cities, 100 km/h on highways
    const avgSpeed = distanceKm > 50 ? 80 : 50;
    const minutes = Math.round((distanceKm / avgSpeed) * 60);
    return `${minutes} mins`;
  },

  // Decode Google Maps polyline (simplified)
  decodePolyline: (encoded) => {
    if (!encoded || encoded.length === 0) return [];

    try {
      const points = [];
      let index = 0, lat = 0, lng = 0;

      while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let byte = 0;

        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        result = 0;
        shift = 0;

        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({
          latitude: lat / 1e5,
          longitude: lng / 1e5,
        });
      }

      return points;
    } catch (e) {
      console.error('Error decoding polyline:', e);
      return [];
    }
  }
};

export default googleMapsService;
