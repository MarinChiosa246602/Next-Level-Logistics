from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import models
from app.services.gemini_vision import GeminiVisionService
from app.pipeline.ocr import OCRService
from datetime import datetime
import uuid
import os

class AIProcessor:
    def __init__(self, db: Session, vision_api_key: str = None, ocr_api_key: str = None):
        self.db = db
        vision_key = vision_api_key or os.getenv("GEMINI_API_KEY")
        if not vision_key:
            raise ValueError("GEMINI_API_KEY not provided and not found in environment")
        self.vision_service = GeminiVisionService(api_key=vision_key)
        self.ocr_service = OCRService(api_key=ocr_api_key)

    async def process_record(self, record_id: uuid.UUID, photo_url: str):
        """
        Main pipeline: Vision -> OCR -> Normalization -> DB Store.
        """
        # 1. Run Vision Analysis
        vision_data = await self.vision_service.analyze_image(photo_url)

        # 2. Run OCR Analysis
        ocr_data = await self.ocr_service.extract_text(photo_url)

        # 3. Map and Normalize
        # Note: In a real app, we'd use a more robust mapping logic.
        extracted_values = {
            "product_type": vision_data["product_type"],
            "category": vision_data["category"],
            "quantity": vision_data["estimated_quantity"],
            "unit": "crates", # Default for AI in MVP
            "condition": vision_data["condition_rating"],
            "expiry_date": ocr_data["expiry_date"],
            "lot_number": ocr_data["lot_number"],
            "ocr_raw_text": ocr_data["raw_text"],
            "model_used": "gpt-4o-vision-mock",
        }

        # 4. Compute Confidence
        confidences = {
            "product_type": vision_data["confidence"]["product_type"],
            "quantity": vision_data["confidence"]["quantity"],
            "condition": vision_data["confidence"]["condition"],
            "expiry_date": ocr_data["confidence"]["expiry_date"],
            "location": 0.5, # AI doesn't know location in this MVP
        }

        overall_confidence = self._calculate_overall_confidence(confidences)
        low_conf_fields = [f for f, v in confidences.items() if v < 0.6]

        # 5. Update Database
        self._save_to_db(record_id, extracted_values, confidences, overall_confidence, low_conf_fields, photo_url)

    def _calculate_overall_confidence(self, confs: Dict[str, float]) -> float:
        weights = {
            "product_type": 0.3,
            "quantity": 0.3,
            "condition": 0.2,
            "expiry_date": 0.1,
            "location": 0.1
        }
        score = sum(confs[f] * weights[f] for f in weights)
        return round(score, 3)

    def _save_to_db(self, record_id: uuid.UUID, values: Dict[str, Any], confs: Dict[str, float],
                   overall: float, low_conf: List[str], photo_url: str):
        # Update the main record
        record = self.db.query(models.Record).filter(models.Record.record_id == record_id).first()
        if record:
            record.ocr_raw_text = values["ocr_raw_text"]
            record.model_used = values["model_used"]
            # Update updated_at
            record.updated_at = datetime.utcnow()

        # Save Product
        product = models.RecordProduct(
            record_id=record_id,
            product_type=values["product_type"],
            product_category=models.ProductCategory(values["category"]),
            quantity=values["quantity"],
            quantity_unit=models.QuantityUnit.crates,
            quantity_source=models.QuantitySource.photo
        )
        self.db.add(product)

        # Save Condition
        condition = models.RecordCondition(
            record_id=record_id,
            rating=models.ConditionRating(values["condition"]),
            source=models.Source.photo
        )
        self.db.add(condition)

        # Save Traceability
        trace = models.RecordTraceability(
            record_id=record_id,
            expiry_date=datetime.strptime(values["expiry_date"], "%Y-%m-%d") if values["expiry_date"] else None,
            lot_number=values["lot_number"]
        )
        self.db.add(trace)

        # Save Confidence
        confidence = models.RecordConfidence(
            record_id=record_id,
            product_type=confs["product_type"],
            quantity=confs["quantity"],
            condition=confs["condition"],
            expiry_date=confs["expiry_date"],
            location=confs["location"],
            overall=overall,
            low_confidence_fields=",".join(low_conf)
        )
        self.db.add(confidence)

        self.db.commit()
