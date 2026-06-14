"""
seed_regions_danil.py
Pushes synthetic test records across all 4 quadrant regions (NW/NE/SW/SE)
so Danil's bot can demo region-based matching in all directions.

Based on the Dutch quadrant split used server-side:
  NW = Noord-Holland area    (lat > 52.5, lng < 5.5)
  NE = Friesland/Groningen   (lat > 52.5, lng > 5.5)
  SW = Zeeland/Noord-Brabant (lat < 52.5, lng < 5.5)
  SE = Limburg area          (lat < 52.5, lng > 5.5)

Run from api/ directory: python seed_regions_danil.py
"""
import asyncio, uuid
import httpx

ENDPOINT = "https://sfsc-bot.duckdns.org/marin/upload"
TOKEN    = "Id6sBkF14gzOEpuvFNXSBNJfUG5Jhu_oMy3cRftkGbs"
HEADERS  = {"Authorization": f"Bearer {TOKEN}"}

# Existing farmer/farm IDs from the DB
FARMER_NW  = "ef51336f-333d-453c-aa3f-9015abcea3f3"  # Henk – Noord-Holland
FARM_NW    = "c09e60d4-21a5-43aa-9f4b-71a0ec62f255"

FARMER_NE  = "9894bcc1-bafa-475d-82a2-be479cb0e166"  # Anneke – Friesland
FARM_NE    = "653b914c-9e63-4890-a9f2-d2980745c9c0"

FARMER_SE  = "91fcb7fd-66d3-4e7e-80b7-16228cfda4ac"  # Henk Smeets – Limburg
FARM_SE    = "57ae6043-92c5-4ea4-ba8c-e0c2083806d2"

FARMER_SW  = "e448426a-be5b-43d1-a990-aa3146ca9f00"  # Maria – Utrecht (use SW coords)
FARM_SW    = "b03baa0b-6f6b-405f-a6c7-71e15af14aff"

RECORDS = [
    # NW – Noord-Holland coast
    dict(category="vegetables", product_type="Tomatoes",  quantity=45, quantity_unit="kg",
         location_lat=52.63, location_lng=4.75, farmer_id=FARMER_NW, farm_id=FARM_NW,
         confidence_overall=0.91, status="confirmed"),
    dict(category="fruit",      product_type="Apples",    quantity=80, quantity_unit="crates",
         location_lat=52.70, location_lng=4.88, farmer_id=FARMER_NW, farm_id=FARM_NW,
         confidence_overall=0.87, status="confirmed"),
    dict(category="vegetables", product_type="Lettuce",   quantity=30, quantity_unit="kg",
         location_lat=52.55, location_lng=4.65, farmer_id=FARMER_NW, farm_id=FARM_NW,
         confidence_overall=0.93, status="pending"),

    # NE – Friesland / Groningen
    dict(category="grain",      product_type="Wheat",     quantity=200, quantity_unit="kg",
         location_lat=53.13, location_lng=6.07, farmer_id=FARMER_NE, farm_id=FARM_NE,
         confidence_overall=0.89, status="confirmed"),
    dict(category="dairy",      product_type="Cheese",    quantity=40, quantity_unit="kg",
         location_lat=53.21, location_lng=5.79, farmer_id=FARMER_NE, farm_id=FARM_NE,
         confidence_overall=0.95, status="confirmed"),

    # SW – Zeeland / Noord-Brabant
    dict(category="vegetables", product_type="Potatoes",  quantity=150, quantity_unit="kg",
         location_lat=51.50, location_lng=4.30, farmer_id=FARMER_SW, farm_id=FARM_SW,
         confidence_overall=0.88, status="confirmed"),
    dict(category="fruit",      product_type="Strawberries", quantity=25, quantity_unit="crates",
         location_lat=51.58, location_lng=4.78, farmer_id=FARMER_SW, farm_id=FARM_SW,
         confidence_overall=0.92, status="confirmed"),
    dict(category="vegetables", product_type="Onions",    quantity=90, quantity_unit="kg",
         location_lat=51.45, location_lng=3.90, farmer_id=FARMER_SW, farm_id=FARM_SW,
         confidence_overall=0.86, status="pending"),

    # SE – Limburg
    dict(category="fruit",      product_type="Cherries",  quantity=20, quantity_unit="crates",
         location_lat=50.85, location_lng=6.07, farmer_id=FARMER_SE, farm_id=FARM_SE,
         confidence_overall=0.94, status="confirmed"),
    dict(category="fruit",      product_type="Pears",     quantity=60, quantity_unit="kg",
         location_lat=51.00, location_lng=5.85, farmer_id=FARMER_SE, farm_id=FARM_SE,
         confidence_overall=0.90, status="confirmed"),
    dict(category="vegetables", product_type="Asparagus", quantity=35, quantity_unit="kg",
         location_lat=51.22, location_lng=5.96, farmer_id=FARMER_SE, farm_id=FARM_SE,
         confidence_overall=0.88, status="pending"),
]

async def push_all():
    async with httpx.AsyncClient(timeout=15) as client:
        for rec in RECORDS:
            payload = {
                "source_record_id": str(uuid.uuid4()),
                **rec,
            }
            resp = await client.post(ENDPOINT, json=payload, headers=HEADERS)
            region = "NW" if rec["location_lat"] > 52.5 and rec["location_lng"] < 5.5 else \
                     "NE" if rec["location_lat"] > 52.5 else \
                     "SW" if rec["location_lng"] < 5.5 else "SE"
            print(f"[{resp.status_code}] {region}  {rec['product_type']:15s}  "
                  f"lat={rec['location_lat']} lng={rec['location_lng']}")

asyncio.run(push_all())
print("\nAll region records pushed.")
