from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
from typing import Optional
import google.generativeai as genai
import os
import re

logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

class VehicleData(BaseModel):
    licensePlate: str
    brand: str
    model: str
    year: Optional[int]
    bootCapacity: Optional[float]
    cargoVolume: Optional[float]
    fuelType: str
    axles: Optional[int]
    maxWeight: Optional[int]
    color: str
    category: str
    seats: Optional[int]
    doors: Optional[int]


def format_license_plate(plate: str) -> str:
    """Format license plate by removing dashes and spaces"""
    return plate.upper().replace("-", "").replace(" ", "").replace(".", "")


async def get_boot_capacity_from_gemini(brand: str, model: str, year: Optional[int]) -> Optional[float]:
    """Query Gemini AI for vehicle boot capacity in liters"""
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not configured")
        return None

    try:
        year_str = f" {year}" if year else ""
        prompt = f"What is the boot/trunk capacity in liters for a {brand} {model}{year_str}? Please respond with just the number (e.g., '450' or '480'). If unsure, provide your best estimate."

        model_obj = genai.GenerativeModel("gemini-2.5-flash")
        response = model_obj.generate_content(prompt)

        if response.text:
            # Extract number from response
            numbers = re.findall(r'\d+', response.text)
            if numbers:
                boot_capacity = float(numbers[0])
                logger.info(f"Gemini boot capacity for {brand} {model}: {boot_capacity}L")
                return boot_capacity
    except Exception as e:
        logger.error(f"Error querying Gemini for boot capacity: {str(e)}")
        return None

    return None


def parse_vehicle_record(record: dict, formatted_plate: str, boot_capacity: Optional[float] = None) -> VehicleData:
    """Parse RDW vehicle record into our VehicleData model"""

    # Try to parse year from registration date
    year = None
    if record.get("eerste_toelating"):
        try:
            year = int(record["eerste_toelating"][:4])
        except:
            pass

    # Use boot capacity from Gemini if available, otherwise try RDW fields
    capacity = boot_capacity
    if not capacity:
        try:
            if record.get("laadvolume"):
                capacity = float(record["laadvolume"])
            elif record.get("koffervolume"):
                capacity = float(record["koffervolume"])
        except:
            pass

    return VehicleData(
        licensePlate=formatted_plate,
        brand=record.get("merk", "Unknown"),
        model=record.get("handelsbenaming", "Unknown"),
        year=year,
        bootCapacity=capacity,
        cargoVolume=capacity,
        fuelType=record.get("brandstof_omschrijving", "Unknown"),
        axles=record.get("aantal_assen"),
        maxWeight=record.get("maximaal_toegestaan_gewicht_voertuig"),
        color=record.get("kleur_omschrijving", "Unknown"),
        category=record.get("voertuigsoort_omschrijving", "Unknown"),
        seats=record.get("aantal_zitplaatsen"),
        doors=record.get("aantal_deuren"),
    )


@router.get("/vehicles/{license_plate}", response_model=VehicleData)
async def get_vehicle_by_license_plate(license_plate: str):
    """
    Get vehicle information from RDW database by license plate.

    Supports formats: AB-12-CD, AB12CD, AB-12CD
    Uses the official RDW vehicle dataset from opendata.rdw.nl (Socrata API)
    """
    try:
        formatted_plate = format_license_plate(license_plate)
        logger.info(f"Looking up vehicle: {formatted_plate}")

        if not formatted_plate:
            raise HTTPException(status_code=400, detail="Invalid license plate format")

        # RDW Socrata API endpoint (no API key needed)
        # Dataset: m9d7-ebf2 (RDW Gekentekende voertuigen)
        url = (
            f"https://opendata.rdw.nl/resource/m9d7-ebf2.json?"
            f"kenteken={formatted_plate}"
        )

        logger.info(f"RDW Socrata API request: {url}")

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)

            logger.info(f"RDW API response status: {response.status_code}")
            logger.info(f"RDW API response body: {response.text}")

            if response.status_code != 200:
                logger.warning(f"RDW API returned status {response.status_code}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Unable to reach RDW database"
                )

            data = response.json()
            logger.info(f"RDW API records count: {len(data)}")

            if not data or len(data) == 0:
                logger.warning(f"Vehicle {formatted_plate} not found in RDW database")
                raise HTTPException(
                    status_code=404,
                    detail=f"Vehicle '{license_plate}' not found. Verify the license plate number."
                )

            vehicle_record = data[0]
            logger.info(f"Found vehicle: {vehicle_record.get('merk')} {vehicle_record.get('handelsbenaming')}")

            # Get boot capacity from Gemini AI
            brand = vehicle_record.get('merk', '')
            model = vehicle_record.get('handelsbenaming', '')
            year = None
            if vehicle_record.get('eerste_toelating'):
                try:
                    year = int(vehicle_record['eerste_toelating'][:4])
                except:
                    pass

            boot_capacity = await get_boot_capacity_from_gemini(brand, model, year)

            return parse_vehicle_record(vehicle_record, formatted_plate, boot_capacity)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying RDW: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving vehicle data: {str(e)}"
        )
