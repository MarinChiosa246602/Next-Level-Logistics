from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from api.app.db.session import get_db
from api.app.models import models
from api.app.schemas import schemas
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/records", response_model=schemas.SubmissionResponse)
def create_record(submission: schemas.FarmerSubmission, db: Session = Depends(get_db)):
    # Create the main record
    record = models.Record(
        record_id=uuid.uuid4(),
        farmer_id=submission.farmer_id,
        # We'll need to look up the farm_id from the farmer
        farm_id=db.query(models.Farmer).filter(models.Farmer.farmer_id == submission.farmer_id).scalar().farm_id,
        location_id=submission.location_id,
        submitted_at=submission.submitted_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        status=models.RecordStatus.pending,
        input_method=models.InputMethod.form_only if submission.input_method == schemas.InputMethod.form else models.InputMethod.photo_plus_form,
        photo_url=submission.photo.file_url if submission.photo else None
    )
    db.add(record)

    # Store form fields in product and condition tables
    if submission.form_fields:
        product = models.RecordProduct(
            record_id=record.record_id,
            product_type=submission.form_fields.product_type or "Unknown",
            product_category=models.ProductCategory.other, # Default for manual submission in Phase 1
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
    location = db.query(models.Location).filter(models.Location.location_id == record.location_id).first()
    farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == record.farmer_id).first()

    # Note: In Phase 1, we don't have AI processing, so we'll return mock extraction data
    return {
        "record_id": record.record_id,
        "farmer_id": record.farmer_id,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "status": record.status.value,
        "product": {
            "type": product.product_type if product else "Unknown",
            "variety": None,
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
            "expiry_date": None,
            "lot_number": None,
            "batch_id": None
        },
        "extraction": {
            "method": "form_only",
            "photo_url": record.photo_url,
            "ocr_raw_text": None,
            "model_used": "manual",
            "confidence": {
                "product_type": 1.0,
                "quantity": 1.0,
                "condition": 1.0,
                "expiry_date": 0.0,
                "location": 1.0,
                "overall": 1.0
            },
            "low_confidence_fields": []
        }
    }
