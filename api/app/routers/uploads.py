from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
import base64
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

        # Return the local file path for now
        # In production, this would be an S3 URL or similar
        file_url = f"http://localhost:8000/static/uploads/{os.path.basename(file_path)}"

        return {"file_url": file_url, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze-photo")
async def analyze_photo(payload: Dict[str, Any] = Body(...)):
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required")

    try:
        vision_service = VisionService()

        # If the URL points to a local file, read it and convert to base64
        if image_url.startswith("http://localhost"):
            file_path = payload.get("file_path")
            if not file_path or not os.path.exists(file_path):
                raise HTTPException(status_code=400, detail="Local file not found")

            # Read the file and convert to base64
            with open(file_path, "rb") as f:
                image_data = f.read()
                base64_image = base64.b64encode(image_data).decode('utf-8')

            analysis = await vision_service.analyze_image_base64(base64_image)
        else:
            # Use URL-based analysis for remote images
            analysis = await vision_service.analyze_image(image_url)

        # Return the formatted response
        return {
            "product_type": analysis.get("product_type"),
            "estimated_quantity": analysis.get("estimated_quantity"),
            "quantity_unit": "kg",
            "condition_rating": analysis.get("condition_rating"),
            "confidence": analysis.get("confidence", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

