import httpx
import base64
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class GeminiVisionService:
    """
    Service for extracting agricultural product information using Google Gemini 2.0 Flash.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}"

    async def analyze_image(self, image_url: str) -> Dict[str, Any]:
        """
        Sends an image to Gemini and extracts product type, category, quantity, and condition.
        """
        try:
            # 1. Fetch the image bytes
            async with httpx.AsyncClient() as client:
                image_resp = await client.get(image_url)
                if image_resp.status_code != 200:
                    raise Exception(f"Failed to fetch image from {image_url}: {image_resp.status_code}")

                image_bytes = image_resp.content
                base64_image = base64.b64encode(image_bytes).decode('utf-8')

            # 2. Prepare the prompt for Gemini
            prompt = (
                "Analyze this agricultural produce image. Return a JSON object with the following keys: "
                "product_type (e.g., Tomatoes), "
                "category (e.g., vegetables, fruit, grain, dairy), "
                "estimated_quantity (as a float), "
                "condition_rating (one of: good, mixed, damaged), "
                "confidence (a dict with keys: product_type, quantity, condition, overall, each as a float 0.0-1.0). "
                "Only return the JSON object, no other text."
            )

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json",
                }
            }

            # 3. Call Gemini API
            async with httpx.AsyncClient() as client:
                response = await client.post(self.endpoint, json=payload)
                if response.status_code != 200:
                    logger.error(f"Gemini API error: {response.text}")
                    raise Exception(f"Gemini API request failed: {response.status_code}")

                result = response.json()
                # Gemini returns content in a nested structure: candidates[0].content.parts[0].text
                text_response = result['candidates'][0]['content']['parts'][0]['text']

                import json
                return json.loads(text_response)

        except Exception as e:
            logger.error(f"Error in GeminiVisionService.analyze_image: {str(e)}")
            raise e
