from typing import Dict, Any, Optional
import random

class VisionService:
    """
    Service for extracting product information from images using a Vision Model.
    In a real production environment, this would call GPT-4o Vision or a similar model.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def analyze_image(self, image_url: str) -> Dict[str, Any]:
        """
        Analyzes the image and returns product type, category, estimated quantity, and condition.
        """
        if not self.api_key:
            return await self._mock_analyze(image_url)

        # Real implementation would go here.
        # Example using a hypothetical GPT-4o client:
        # response = await client.chat.completions.create(
        #     model="gpt-4o",
        #     messages=[{"role": "user", "content": [
        #         {"type": "text", "text": "Analyze this agricultural produce. Extract: product_type, category, estimated_quantity, condition_rating."},
        #         {"type": "image_url", "image_url": {"url": image_url}}
        #     ]}]
        # )
        # return self._parse_gpt_response(response)

        # For now, fall back to mock if not implemented
        return await self._mock_analyze(image_url)

    async def _mock_analyze(self, image_url: str) -> Dict[str, Any]:
        """
        Deterministic mock analysis based on the image URL.
        """
        # Use the URL to create a stable "random" result for testing
        seed = sum(ord(c) for c in image_url)
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
