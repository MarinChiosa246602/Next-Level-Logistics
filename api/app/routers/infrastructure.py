from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
import uuid

router = APIRouter()

@router.get("/locations", response_model=schemas.LocationsResponse)
def get_locations(farm_id: UUID, db: Session = Depends(get_db)):
    locations = db.query(models.Location).filter(models.Location.farm_id == farm_id, models.Location.active == True).all()
    return {
        "locations": [
            schemas.LocationRead(
                location_id=loc.location_id,
                label=loc.label,
                type=loc.type.value
            ) for loc in locations
        ]
    }

@router.post("/photos/upload")
async def upload_photo(file: UploadFile = File(...)):
    # In a real app, we would upload to S3/MinIO here.
    # For now, we'll simulate it by returning a mock URL.
    file_id = str(uuid.uuid4())
    mock_url = f"https://s3.amazonaws.com/farmer-data/photos/{file_id}_{file.filename}"
    return {
        "photo_url": mock_url,
        "upload_id": file_id
    }
