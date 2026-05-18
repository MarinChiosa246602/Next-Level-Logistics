import httpx
import base64
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class GeminiVisionService:
    """
    Service for extracting agricultural product information using Google Gemini 2.5 Flash.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"

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

            return await self._send_to_gemini(base64_image)

        except Exception as e:
            logger.error(f"Error in GeminiVisionService.analyze_image: {str(e)}")
            raise e

    async def analyze_image_base64(self, base64_image: str) -> Dict[str, Any]:
        """
        Analyzes a base64-encoded image using Gemini.
        """
        try:
            return await self._send_to_gemini(base64_image)
        except Exception as e:
            logger.error(f"Error in GeminiVisionService.analyze_image_base64: {str(e)}")
            raise e

    async def _send_to_gemini(self, base64_image: str) -> Dict[str, Any]:
        """
        Sends a base64-encoded image to Gemini API and returns analysis.
        """
        try:
            prompt = (
                "Analyze this agricultural produce image. Return a JSON object with the following keys: "
                "product_type (e.g., Tomatoes), "
                "category (e.g., vegetables, fruit, grain, dairy), "
                "estimated_quantity (as a float), "
                "condition_rating (one of: good, mixed, damaged), "
                "confidence (a dict with keys: product_type, quantity, condition, each as a float 0.0-1.0). "
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
                }]
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(self.endpoint, json=payload, timeout=30.0)
                logger.info(f"Gemini response status: {response.status_code}")

                if response.status_code != 200:
                    logger.error(f"Gemini API error {response.status_code}: {response.text}")
                    raise Exception(f"Gemini API returned {response.status_code}")

                result = response.json()
                logger.debug(f"Gemini raw response: {result}")

                if 'candidates' not in result or not result['candidates']:
                    logger.error(f"No candidates in Gemini response: {result}")
                    raise Exception("Gemini returned no candidates")

                text_response = result['candidates'][0]['content']['parts'][0].get('text', '').strip()
                logger.debug(f"Gemini text response: {text_response}")

                if not text_response:
                    raise Exception("Gemini returned empty text")

                import json

                # Strip markdown code fences if present
                if text_response.startswith('```'):
                    text_response = text_response.replace('```json', '').replace('```', '').strip()

                try:
                    return json.loads(text_response)
                except json.JSONDecodeError as e:
                    logger.error(f"Gemini returned non-JSON: {text_response}")
                    raise Exception(f"Gemini response not JSON: {text_response[:100]}")

        except Exception as e:
            logger.error(f"Error in GeminiVisionService._send_to_gemini: {str(e)}")
            raise e
