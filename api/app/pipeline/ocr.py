from typing import Dict, Any, Optional, List
import random

class OCRService:
    """
    Service for extracting text from images using OCR.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def extract_text(self, image_url: str) -> Dict[str, Any]:
        """
        Extracts text from the image and attempts to find expiry dates and lot numbers.
        """
        if not self.api_key:
            return await self._mock_extract(image_url)

        # Real implementation would use EasyOCR or similar.
        # text = easyocr_reader.readtext(image_url)
        # return self._parse_ocr_text(text)

        return await self._mock_extract(image_url)

    async def _mock_extract(self, image_url: str) -> Dict[str, Any]:
        """
        Deterministic mock OCR extraction based on the image URL.
        """
        seed = sum(ord(c) for c in image_url)
        random.seed(seed)

        # Mock OCR raw text
        raw_text = f"LOT-#{random.randint(1000, 9999)} EXP: 2026-12-31 Product: {seed % 100}"

        return {
            "raw_text": raw_text,
            "expiry_date": "2026-12-31" if random.random() > 0.3 else None,
            "lot_number": f"LOT-{random.randint(1000, 9999)}",
            "confidence": {
                "expiry_date": round(random.uniform(0.4, 0.9), 3),
                "lot_number": round(random.uniform(0.7, 1.0), 3),
            }
        }
