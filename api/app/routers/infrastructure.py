from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.get("/farmers")
def list_farmers(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """List all farmers with their farm info — used by the management dashboard."""
    farmers = db.query(models.Farmer).offset(offset).limit(limit).all()
    return [
        {
            "farmer_id": f.farmer_id,
            "farm_id":   f.farm_id,
            "name":      f.name,
            "username":  f.username,
            "phone_number": f.phone_number,
        }
        for f in farmers
    ]

@router.get("/farmer/{farmer_id}")
def get_farmer(farmer_id: str, db: Session = Depends(get_db)):
    farmer = None

    # Try to parse as UUID first
    try:
        uuid_id = UUID(farmer_id)
        farmer = db.query(models.Farmer).filter(models.Farmer.farmer_id == uuid_id).first()
    except ValueError:
        # If not a valid UUID, search by username
        farmer = db.query(models.Farmer).filter(models.Farmer.username == farmer_id).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {
        "farmer_id": farmer.farmer_id,
        "farm_id": farmer.farm_id,
        "name": farmer.name,
        "phone_number": farmer.phone_number,
        "preferred_language": farmer.preferred_language
    }

@router.get("/locations", response_model=schemas.LocationsResponse)
def get_locations(farm_id: str, db: Session = Depends(get_db)):
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

@router.post("/seed-farms")
def seed_farms(db: Session = Depends(get_db)):
    """Seed database with sample Dutch farms, locations, and farmers"""
    # Check if farms already exist
    existing_farms = db.query(models.Farm).count()
    if existing_farms > 0:
        return {"message": "Farms already seeded", "count": existing_farms}

    dutch_farms = [
        {
            "name": "De Groene Tuin",
            "owner_name": "Jan van den Berg",
            "region": "Noord-Holland",
            "farmers": [
                {"name": "Henk van den Berg", "phone_number": "+31612345678"}
            ],
            "locations": [
                {"label": "Veld 1", "type": "field", "lat": 52.5200, "lng": 5.2913},
                {"label": "Veld 2", "type": "field", "lat": 52.5201, "lng": 5.2914},
                {"label": "Opslag", "type": "storage", "lat": 52.5202, "lng": 5.2915},
            ]
        },
        {
            "name": "Boerderij Zonnekost",
            "owner_name": "Maria Jansen",
            "region": "Utrecht",
            "farmers": [
                {"name": "Maria Jansen", "phone_number": "+31687654321"}
            ],
            "locations": [
                {"label": "Aardappelveld", "type": "field", "lat": 52.0116, "lng": 5.1734},
                {"label": "Koolteelt", "type": "field", "lat": 52.0117, "lng": 5.1735},
                {"label": "Distributiepunt", "type": "distribution_point", "lat": 52.0118, "lng": 5.1736},
            ]
        },
        {
            "name": "Polder Fresh",
            "owner_name": "Peter de Vries",
            "region": "Flevoland",
            "farmers": [
                {"name": "Peter de Vries", "phone_number": "+31698765432"},
                {"name": "Kees van der Meer", "phone_number": "+31654321098"}
            ],
            "locations": [
                {"label": "Tomatenkas", "type": "field", "lat": 52.6500, "lng": 5.8000},
                {"label": "Sla teelt", "type": "field", "lat": 52.6501, "lng": 5.8001},
                {"label": "Koeling", "type": "storage", "lat": 52.6502, "lng": 5.8002},
                {"label": "Verpakking", "type": "distribution_point", "lat": 52.6503, "lng": 5.8003},
            ]
        },
        {
            "name": "Bio Akkerbouw Friesland",
            "owner_name": "Anneke Vink",
            "region": "Friesland",
            "farmers": [
                {"name": "Anneke Vink", "phone_number": "+31622334455"}
            ],
            "locations": [
                {"label": "Graan veld", "type": "field", "lat": 53.1300, "lng": 6.0700},
                {"label": "Biologisch veld", "type": "field", "lat": 53.1301, "lng": 6.0701},
                {"label": "Loods", "type": "storage", "lat": 53.1302, "lng": 6.0702},
            ]
        },
        {
            "name": "Limburgs Fruit",
            "owner_name": "Henk Smeets",
            "region": "Limburg",
            "farmers": [
                {"name": "Henk Smeets", "phone_number": "+31655667788"}
            ],
            "locations": [
                {"label": "Appelboomgaard", "type": "field", "lat": 50.8500, "lng": 6.0700},
                {"label": "Peerenboomgaard", "type": "field", "lat": 50.8501, "lng": 6.0701},
                {"label": "Koude opslag", "type": "storage", "lat": 50.8502, "lng": 6.0702},
                {"label": "Verzendpunt", "type": "distribution_point", "lat": 50.8503, "lng": 6.0703},
            ]
        }
    ]

    now = datetime.now(timezone.utc)
    created_farmers = []

    for farm_data in dutch_farms:
        farm = models.Farm(
            name=farm_data["name"],
            owner_name=farm_data["owner_name"],
            region=farm_data["region"],
            created_at=now
        )
        db.add(farm)
        db.flush()  # Get the farm_id

        # Add locations
        for loc_data in farm_data["locations"]:
            location = models.Location(
                farm_id=farm.farm_id,
                label=loc_data["label"],
                type=models.LocationType[loc_data["type"]],
                lat=loc_data.get("lat"),
                lng=loc_data.get("lng"),
                active=True
            )
            db.add(location)

        # Add farmers
        for i, farmer_data in enumerate(farm_data["farmers"]):
            simple_names = ["mike", "john", "maria", "peter", "kees", "anna"]
            username = simple_names[i % len(simple_names)] if "username" not in farmer_data else farmer_data.get("username")
            farmer = models.Farmer(
                farm_id=farm.farm_id,
                name=farmer_data["name"],
                username=username,
                phone_number=farmer_data.get("phone_number"),
                preferred_language="nl",
                created_at=now
            )
            db.add(farmer)
            db.flush()
            created_farmers.append({
                "farmer_id": str(farmer.farmer_id),
                "username": username,
                "name": farmer.name,
                "farm_id": str(farm.farm_id),
                "farm_name": farm.name
            })

    db.commit()

    return {
        "message": "Farms and farmers seeded successfully",
        "farmer_count": len(created_farmers),
        "farmers": created_farmers
    }
