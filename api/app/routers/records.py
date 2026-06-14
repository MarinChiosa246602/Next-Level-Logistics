from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.pipeline.processor import AIProcessor
from app.services.webhook import WebhookService
from app.services import push_to_danil
from datetime import datetime
import uuid
import asyncio
import io
import csv
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/records", response_model=schemas.SubmissionResponse)
async def create_record(submission: schemas.FarmerSubmission, db: Session = Depends(get_db)):

    logger.info(f"Received submission: farmer_id={submission.farmer_id}, location_id={submission.location_id}")

    # Create the main record
    farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == str(submission.farmer_id)).first()
    logger.info(f"Farmer lookup result: {farmer}")

    if not farmer:
        logger.error(f"Farmer not found for ID: {submission.farmer_id}")
        raise HTTPException(status_code=404, detail="Farmer not found")

    record = models.Record(
        record_id=str(uuid.uuid4()),
        farmer_id=str(submission.farmer_id),
        farm_id=str(farmer.farm_id),
        location_id=str(submission.location_id),
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
            record_id=str(record.record_id),
            product_type=submission.form_fields.product_type or "Unknown",
            product_category=models.ProductCategory.other,
            quantity=submission.form_fields.quantity or 0.0,
            quantity_unit=submission.form_fields.quantity_unit or models.QuantityUnit.kg,
            quantity_source=models.QuantitySource.form
        )
        db.add(product)

        condition = models.RecordCondition(
            record_id=str(record.record_id),
            rating=submission.form_fields.condition or models.ConditionRating.good,
            notes=submission.form_fields.notes,
            source=models.Source.form
        )
        db.add(condition)

    db.commit()

    # Trigger AI processing if a photo is provided (best-effort — never crashes the submission)
    if record.photo_url:
        try:
            processor = AIProcessor(db=db)
            await processor.process_record(str(record.record_id), record.photo_url)
            # push_to_danil is called inside processor._save_to_db after AI commit
        except Exception as ai_err:
            logger.warning(f"AI processing skipped for record {record.record_id}: {ai_err}")

    else:
        # Form-only path: push immediately after the form commit
        location = db.query(models.Location).filter(
            models.Location.location_id == str(submission.location_id)
        ).first()
        product_type = submission.form_fields.product_type if submission.form_fields else "Unknown"
        category = "other"
        quantity = float(submission.form_fields.quantity or 0) if submission.form_fields else 0.0
        quantity_unit = (
            submission.form_fields.quantity_unit.value
            if submission.form_fields and submission.form_fields.quantity_unit
            else "kg"
        )
        push_to_danil.push(
            source_record_id=str(record.record_id),
            category=category,
            product_type=product_type,
            quantity=quantity,
            quantity_unit=quantity_unit,
            location_lat=float(location.lat) if location and location.lat else None,
            location_lng=float(location.lng) if location and location.lng else None,
            confidence_overall=1.0,  # form input is treated as fully confident
            status="pending",
            farm_id=str(farmer.farm_id),
            farmer_id=str(submission.farmer_id),
        )

    return {
        "record_id": str(record.record_id),
        "status": "pending",
        "estimated_processing_ms": 3000,
        "message": "Record received. AI processing started."
    }

@router.get("/records/{record_id}", response_model=schemas.ProcessedRecord)
def get_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(models.Record).filter(models.Record.record_id == str(record_id)).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    product = db.query(models.RecordProduct).filter(models.RecordProduct.record_id == str(record_id)).first()
    condition = db.query(models.RecordCondition).filter(models.RecordCondition.record_id == str(record_id)).first()
    trace = db.query(models.RecordTraceability).filter(models.RecordTraceability.record_id == str(record_id)).first()
    conf = db.query(models.RecordConfidence).filter(models.RecordConfidence.record_id == str(record_id)).first()
    location = db.query(models.Location).filter(models.Location.location_id == str(record.location_id)).first()
    farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == str(record.farmer_id)).first()

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

@router.get("/records")
def list_records(
    farm_id: str = None,
    farmer_id: str = None,
    status: str = None,
    from_date: str = None,
    to_date: str = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(models.Record)

    if farm_id and farm_id.strip():
        query = query.filter(models.Record.farm_id == str(farm_id))
    if farmer_id and farmer_id.strip():
        query = query.filter(models.Record.farmer_id == str(farmer_id))
    if status and status.strip():
        query = query.filter(models.Record.status == models.RecordStatus(status))
    if from_date and from_date.strip():
        query = query.filter(models.Record.submitted_at >= datetime.fromisoformat(from_date))
    if to_date and to_date.strip():
        query = query.filter(models.Record.submitted_at <= datetime.fromisoformat(to_date))

    records = query.order_by(models.Record.submitted_at.desc()).offset(offset).limit(limit).all()

    result = []
    for r in records:
        product = db.query(models.RecordProduct).filter(models.RecordProduct.record_id == str(r.record_id)).first()
        location = db.query(models.Location).filter(models.Location.location_id == str(r.location_id)).first()
        conf = db.query(models.RecordConfidence).filter(models.RecordConfidence.record_id == str(r.record_id)).first()
        result.append({
            "record_id": r.record_id,
            "farmer_id": r.farmer_id,
            "farm_id": r.farm_id,
            "submitted_at": r.submitted_at,
            "created_at": r.created_at,
            "status": r.status.value,
            "photo_url": r.photo_url,
            "product_type": product.product_type if product else "Unknown",
            "quantity": product.quantity if product else 0,
            "quantity_unit": product.quantity_unit.value if product else "kg",
            "location": location.label if location else "Unknown",
            "location_type": location.type.value if location else "storage",
            "confidence": conf.overall if conf else None,
        })

    return result

@router.patch("/records/{record_id}")
async def update_record_status(
    record_id: str,
    request: dict,
    db: Session = Depends(get_db)
):
    status_value = request.get("status")
    if not status_value:
        raise HTTPException(status_code=400, detail="status is required")

    try:
        status = models.RecordStatus(status_value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status_value}")

    record = db.query(models.Record).filter(models.Record.record_id == str(record_id)).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    old_status = record.status
    record.status = status
    record.updated_at = datetime.utcnow()
    db.commit()

    if status == models.RecordStatus.confirmed and old_status != models.RecordStatus.confirmed:
        # Trigger Webhook
        webhook = WebhookService()
        # We need full record data for the webhook
        full_record = {
            "record_id": str(record.record_id),
            "farm_id": str(record.farm_id),
            "updated_at": record.updated_at.isoformat(),
            "status": record.status.value,
            "photo_url": record.photo_url
        }
        await webhook.send_confirmation(full_record)

    return {"message": "Status updated", "status": status.value}

@router.get("/records/export")
def export_records(
    farm_id: str = None,
    farmer_id: str = None,
    status: str = None,
    from_date: str = None,
    to_date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Record)
    if farm_id and farm_id.strip():
        query = query.filter(models.Record.farm_id == str(farm_id))
    if farmer_id and farmer_id.strip():
        query = query.filter(models.Record.farmer_id == str(farmer_id))
    if status and status.strip():
        try:
            query = query.filter(models.Record.status == models.RecordStatus(status))
        except ValueError:
            pass
    if from_date and from_date.strip():
        query = query.filter(models.Record.submitted_at >= datetime.fromisoformat(from_date))
    if to_date and to_date.strip():
        query = query.filter(models.Record.submitted_at <= datetime.fromisoformat(to_date))

    records = query.order_by(models.Record.submitted_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "record_id", "farmer_id", "farm_id", "submitted_at", "product_type",
        "product_category", "quantity", "quantity_unit", "condition",
        "location_label", "location_type", "expiry_date", "lot_number",
        "input_method", "overall_confidence", "status"
    ])

    for r in records:
        prod = db.query(models.RecordProduct).filter(models.RecordProduct.record_id == str(r.record_id)).first()
        cond = db.query(models.RecordCondition).filter(models.RecordCondition.record_id == str(r.record_id)).first()
        trace = db.query(models.RecordTraceability).filter(models.RecordTraceability.record_id == str(r.record_id)).first()
        conf = db.query(models.RecordConfidence).filter(models.RecordConfidence.record_id == str(r.record_id)).first()
        loc = db.query(models.Location).filter(models.Location.location_id == str(r.location_id)).first()

        writer.writerow([
            r.record_id, r.farmer_id, r.farm_id, r.submitted_at,
            prod.product_type if prod else "",
            prod.product_category.value if prod else "",
            prod.quantity if prod else "",
            prod.quantity_unit.value if prod else "",
            cond.rating.value if cond else "",
            loc.label if loc else "",
            loc.type.value if loc else "",
            trace.expiry_date if trace else "",
            trace.lot_number if trace else "",
            r.input_method.value,
            conf.overall if conf else "",
            r.status.value
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=records_export.csv"}
    )
