from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
from typing import Dict, Any
from app.pipeline.vision import VisionService

router = APIRouter()
UPLOAD_DIR = "uploads"

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # In a real app, this would be an S3 URL
        file_url = f"http://localhost:8000/static/uploads/{os.path.basename(file_path)}"

        return {"file_url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze-photo")
async def analyze_photo(payload: Dict[str, Any] = Body(...)):
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required")

    try:
        vision_service = VisionService()
        analysis = await vision_service.analyze_image(image_url)

        # The frontend expects product_type, estimated_quantity, quantity_unit, condition, and confidence
        return {
            "product_type": analysis["product_type"],
            "estimated_quantity": analysis["estimated_quantity"],
            "quantity_unit": "kg", # Default for mock
            "condition_rating": analysis["condition_rating"],
            "confidence": analysis["confidence"],
            "overall": sum(analysis["confidence"].values()) / len(analysis["confidence"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
