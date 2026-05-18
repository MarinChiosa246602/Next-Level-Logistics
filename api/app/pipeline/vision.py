from typing import Dict, Any, Optional
import random
from app.services.gemini_vision import GeminiVisionService
import os

class VisionService:
    """
    Service for extracting product information from images using a Vision Model.
    Uses Google Gemini 2.5 Flash when API key is available.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if self.api_key:
            self.gemini_service = GeminiVisionService(self.api_key)
        else:
            self.gemini_service = None

    async def analyze_image(self, image_url: str) -> Dict[str, Any]:
        """
        Analyzes the image and returns product type, category, estimated quantity, and condition.
        Uses Gemini API if key is available, otherwise returns mock data.
        """
        if self.gemini_service:
            try:
                result = await self.gemini_service.analyze_image(image_url)
                return result
            except Exception as e:
                # Fallback to mock if Gemini fails
                print(f"Gemini analysis failed: {e}, using mock data")
                return await self._mock_analyze(image_url)

        return await self._mock_analyze(image_url)

    async def analyze_image_base64(self, base64_image: str) -> Dict[str, Any]:
        """
        Analyzes a base64-encoded image.
        Uses Gemini API if key is available, otherwise returns mock data.
        """
        if self.gemini_service:
            try:
                result = await self.gemini_service.analyze_image_base64(base64_image)
                return result
            except Exception as e:
                # Fallback to mock if Gemini fails
                print(f"Gemini analysis failed: {e}, using mock data")
                return await self._mock_analyze("")

        return await self._mock_analyze("")

    async def _mock_analyze(self, image_url: str) -> Dict[str, Any]:
        """
        Deterministic mock analysis based on the image URL.
        """
        seed = sum(ord(c) for c in image_url) if image_url else 42
        random.seed(seed)

        products = [
            ("Tomatoes", "vegetables"),
            ("Apples", "fruit"),
            ("Milk", "dairy"),
            ("Wheat", "grain"),
            ("Lettuce", "vegetables")
        ]

        prod_type, category = products[seed % len(products)]

        return {
            "product_type": prod_type,
            "category": category,
            "estimated_quantity": float(random.randint(10, 100)),
            "condition_rating": random.choice(["good", "mixed", "damaged"]),
            "confidence": {
                "product_type": round(random.uniform(0.6, 1.0), 3),
                "quantity": round(random.uniform(0.5, 0.9), 3),
                "condition": round(random.uniform(0.6, 0.9), 3),
            }
        }
