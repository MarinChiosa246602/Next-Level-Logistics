from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import models
from app.services.gemini_vision import GeminiVisionService
from app.pipeline.ocr import OCRService
from datetime import datetime
import uuid
import os
import base64
import logging
import requests

logger = logging.getLogger(__name__)

class AIProcessor:
    def __init__(self, db: Session, vision_api_key: str = None, ocr_api_key: str = None):
        self.db = db
        vision_key = vision_api_key or os.getenv("GEMINI_API_KEY")
        if not vision_key:
            raise ValueError("GEMINI_API_KEY not provided and not found in environment")
        self.vision_service = GeminiVisionService(api_key=vision_key)
        self.ocr_service = OCRService(api_key=ocr_api_key)

    async def _analyze_photo(self, photo_url: str) -> Dict[str, Any]:
        """
        Analyze a photo for vision data.

        For localhost URLs (files stored on this server) we read the file
        directly from disk and call analyze_image_base64, avoiding an HTTP
        round-trip that would return 404 because the static mount is not
        reachable from within the same process context.

        For remote URLs (S3, etc.) we delegate to analyze_image as normal.
        """
        if photo_url and "localhost" in photo_url:
            # Derive the local file path from the URL
            # URL pattern: http://localhost:8000/static/uploads/<filename>
            filename = photo_url.split("/")[-1]
            file_path = os.path.join("uploads", filename)
            if os.path.exists(file_path):
                logger.info(f"Reading photo from disk: {file_path}")
                with open(file_path, "rb") as f:
                    image_bytes = f.read()
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                return await self.vision_service.analyze_image_base64(base64_image)
            else:
                logger.warning(
                    f"Photo file not found on disk at {file_path} "
                    f"(URL: {photo_url}) — falling back to mock analysis"
                )
                return self.vision_service._mock_response()

        # Remote URL path
        return await self.vision_service.analyze_image(photo_url)

    async def process_record(self, record_id: uuid.UUID, photo_url: str):
        """
        Main pipeline: Vision -> OCR -> Normalization -> DB Store.

        For localhost photo URLs the file is already on disk — we read it
        directly instead of making an HTTP round-trip (which would 404 when
        the Gemini service fetches it from itself).
        """
        # 1. Run Vision Analysis
        vision_data = await self._analyze_photo(photo_url)

        # 2. Run OCR Analysis
        ocr_data = await self.ocr_service.extract_text(photo_url)

        # 3. Map and Normalize
        # Note: In a real app, we'd use a more robust mapping logic.
        extracted_values = {
            "product_type": vision_data["product_type"],
            "category": vision_data["category"],
            "quantity": vision_data["estimated_quantity"],
            "unit": "kg", # Default for AI in MVP
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
            record.updated_at = datetime.utcnow()

            # Auto-promote rule
            is_complete = bool(
                values.get("product_type") and
                values.get("category") and
                values.get("quantity", 0) > 0
            )
            if overall >= 0.7 and is_complete:
                record.status = models.RecordStatus.confirmed
            else:
                record.status = models.RecordStatus.pending

        # Save Product
        form_product = self.db.query(models.RecordProduct).filter(
            models.RecordProduct.record_id == str(record_id),
            models.RecordProduct.quantity_source == models.QuantitySource.form
        ).first()

        if form_product:
            if values["product_type"] != "Unknown":
                form_product.product_type = values["product_type"]
            if values["category"] != "other":
                form_product.product_category = models.ProductCategory(values["category"])
            final_quantity = float(form_product.quantity)
            final_unit = form_product.quantity_unit.value
        else:
            product = models.RecordProduct(
                record_id=str(record_id),
                product_type=values["product_type"],
                product_category=models.ProductCategory(values["category"]),
                quantity=values["quantity"],
                quantity_unit=models.QuantityUnit.kg,
                quantity_source=models.QuantitySource.photo
            )
            self.db.add(product)
            final_quantity = values.get("quantity", 0.0)
            final_unit = "kg"

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

        # --- Real-time push to Danil's matching endpoint ---
        # We delegate this to the push_to_danil background task to avoid blocking
        # and to ensure uniform mapping and validation rules are applied.
        from app.services import push_to_danil
        
        location = None
        if record and record.location_id:
            location = self.db.query(models.Location).filter(
                models.Location.location_id == str(record.location_id)
            ).first()

        final_product_type = form_product.product_type if form_product else values.get("product_type", "Unknown")
        final_category = form_product.product_category.value if form_product else values.get("category", "other")

        if final_category == "other":
            pt_lower = final_product_type.lower()
            if any(x in pt_lower for x in ["apple", "pear", "cherries", "strawberr", "lime", "citrus", "fruit"]):
                final_category = "fruit"
            elif any(x in pt_lower for x in ["carrot", "tomato", "potato", "asparagus", "vegetable", "lettuce", "onion"]):
                final_category = "vegetables"
            elif any(x in pt_lower for x in ["cheese", "kaas", "milk", "dairy", "butter"]):
                final_category = "dairy"
            elif any(x in pt_lower for x in ["wheat", "bread", "grain"]):
                final_category = "grain"
            elif any(x in pt_lower for x in ["meat", "vlees", "beef", "pork", "chicken"]):
                final_category = "meat"

        push_to_danil.push(
            source_record_id=str(record_id),
            category=final_category,
            product_type=final_product_type,
            quantity=final_quantity,
            quantity_unit=final_unit,
            location_lat=float(location.lat) if location and location.lat else None,
            location_lng=float(location.lng) if location and location.lng else None,
            confidence_overall=overall,
            status=record.status.value if record else "pending",
            farm_id=str(record.farm_id) if record else None,
            farmer_id=str(record.farmer_id) if record else None,
            photo_url=photo_url,
            ocr_raw_text=values.get("ocr_raw_text"),
            expiry_date=values.get("expiry_date")
        )
