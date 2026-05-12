from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.pipeline.processor import AIProcessor
from datetime import datetime
import uuid
import asyncio

router = APIRouter()

@router.post("/records", response_model=schemas.SubmissionResponse)
async def create_record(submission: schemas.FarmerSubmission, db: Session = Depends(get_db)):
    # Create the main record
    farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == submission.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    record = models.Record(
        record_id=uuid.uuid4(),
        farmer_id=submission.farmer_id,
        farm_id=farmer.farm_id,
        location_id=submission.location_id,
        submitted_at=submission.submitted_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        status=models.RecordStatus.pending,
        input_method=models.InputMethod.form_only if submission.input_method == schemas.InputMethod.form else models.InputMethod.photo_plus_form,
        photo_url=submission.photo.file_url if submission.photo else None
    )
    db.add(record)

    # Store form fields if provided
    if submission.form_fields:
        product = models.RecordProduct(
            record_id=record.record_id,
            product_type=submission.form_fields.product_type or "Unknown",
            product_category=models.ProductCategory.other,
            quantity=submission.form_fields.quantity or 0.0,
            quantity_unit=submission.form_fields.quantity_unit or models.QuantityUnit.kg,
            quantity_source=models.QuantitySource.form
        )
        db.add(product)

        condition = models.RecordCondition(
            record_id=record.record_id,
            rating=submission.form_fields.condition or models.ConditionRating.good,
            notes=submission.form_fields.notes,
            source=models.Source.form
        )
        db.add(condition)

    db.commit()

    # Trigger AI processing if a photo is provided
    if record.photo_url:
        processor = AIProcessor(db=db)
        # We run it as a task to avoid blocking the response too long,
        # although the README says "within 5 seconds", we'll call it here.
        # For a true async setup, this would be a Celery task.
        await processor.process_record(record.record_id, record.photo_url)

    return {
        "record_id": record.record_id,
        "status": "pending",
        "estimated_processing_ms": 3000,
        "message": "Record received. AI processing started."
    }

@router.get("/records/{record_id}", response_model=schemas.ProcessedRecord)
def get_record(record_id: UUID, db: Session = Depends(get_db)):
    record = db.query(models.Record).filter(models.Record.record_id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    product = db.query(models.RecordProduct).filter(models.RecordProduct.record_id == record_id).first()
    condition = db.query(models.RecordCondition).filter(models.RecordCondition.record_id == record_id).first()
    trace = db.query(models.RecordTraceability).filter(models.RecordTraceability.record_id == record_id).first()
    conf = db.query(models.RecordConfidence).filter(models.RecordConfidence.record_id == record_id).first()
    location = db.query(models.Location).filter(models.Location.location_id == record.location_id).first()
    farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == record.farmer_id).first()

    return {
        "record_id": record.record_id,
        "farmer_id": record.farmer_id,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "status": record.status.value,
        "product": {
            "type": product.product_type if product else "Unknown",
            "variety": product.variety if product and product.variety else None,
            "category": product.product_category.value if product else "other"
        },
        "quantity": {
            "estimated": product.quantity if product else 0.0,
            "unit": product.quantity_unit.value if product else "kg",
            "source": product.quantity_source.value if product else "form"
        },
        "condition": {
            "rating": condition.rating.value if condition else "good",
            "notes": condition.notes if condition else None,
            "source": condition.source.value if condition else "form"
        },
        "provenance": {
            "farm_id": farmer.farm_id,
            "location_id": record.location_id,
            "location_type": location.type.value if location else "storage",
            "location_label": location.label if location else "Unknown"
        },
        "traceability": {
            "expiry_date": trace.expiry_date if trace else None,
            "lot_number": trace.lot_number if trace else None,
            "batch_id": trace.batch_id if trace else None
        },
        "extraction": {
            "method": "photo_plus_form" if record.photo_url else "form_only",
            "photo_url": record.photo_url,
            "ocr_raw_text": record.ocr_raw_text,
            "model_used": record.model_used,
            "confidence": {
                "product_type": conf.product_type if conf else 1.0,
                "quantity": conf.quantity if conf else 1.0,
                "condition": conf.condition if conf else 1.0,
                "expiry_date": conf.expiry_date if conf and conf.expiry_date else 0.0,
                "location": conf.location if conf else 1.0,
                "overall": conf.overall if conf else 1.0
            },
            "low_confidence_fields": conf.low_confidence_fields.split(",") if conf and conf.low_confidence_fields else []
        }
    }
