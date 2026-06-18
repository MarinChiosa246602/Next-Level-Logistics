"""
push_to_danil.py
~~~~~~~~~~~~~~~~
Fire-and-forget push to Danil's real-time matching endpoint.
Called after every SQLite commit so his WhatsApp bot sees the record
within ~1 second.

Design decisions:
  - Uses httpx (already a project dependency) with an async client.
  - Wrapped in asyncio.create_task so it never blocks the API response.
  - All errors are logged, never re-raised — pipeline integrity first.
  - Token stored as a module-level constant; rotate here if Danil issues
    a new one.
"""
import asyncio
import logging
import uuid
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_ENDPOINT = "https://sfsc-bot.duckdns.org/marin/upload"
_TOKEN = "Id6sBkF14gzOEpuvFNXSBNJfUG5Jhu_oMy3cRftkGbs"
_HEADERS = {"Content-Type": "application/json", "Authorization": f"Bearer {_TOKEN}"}
_TIMEOUT = 10  # seconds
_pending_tasks = set()

def _map_category(product_type: str, category: str) -> Optional[str]:
    pt = (product_type or "").lower()
    cat = (category or "").lower()
    
    if any(x in pt for x in ["apple", "pear", "cherries", "strawberr", "lime", "citrus"]):
        return "Fruit & conserven"
    if any(x in pt for x in ["carrot", "tomato", "potato", "asparagus", "vegetable", "lettuce", "onion"]):
        return "Groente"
    if "cheese" in pt or "kaas" in pt:
        return "Kaas"
    if "wheat" in pt or "bread" in pt or "grain" in cat:
        return "Brood"
    if "meat" in pt or "vlees" in pt:
        return "Vleeswaren"
    if "drink" in pt or "drank" in pt:
        return "Drank"
    if "honey" in pt or "honing" in pt:
        return "Honing"
    if "egg" in pt or "eieren" in pt:
        return "Eieren"
        
    if "fruit" in cat: return "Fruit & conserven"
    if "vegetable" in cat: return "Groente"
    if "dairy" in cat: return "Kaas"
    
    return "Overige"

def _map_region(lat: Optional[float], lng: Optional[float]) -> Optional[str]:
    if lat is None or lng is None:
        return None
    if lat > 52.5 and lng < 5.5: return "NW"
    if lat > 52.5: return "NE"
    if lng < 5.5: return "SW"
    return "SE"



async def _do_push(payload: dict) -> None:
    """Inner coroutine — performs the actual HTTP POST."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(_ENDPOINT, json=payload, headers=_HEADERS)
            if resp.status_code == 200:
                logger.info(
                    "push_to_danil: OK %s  source_record_id=%s",
                    resp.status_code,
                    payload.get("source_record_id"),
                )
            else:
                logger.warning(
                    "push_to_danil: HTTP %s — %s",
                    resp.status_code,
                    resp.text[:200],
                )
    except Exception as exc:  # network errors, timeouts, etc.
        logger.warning("push_to_danil: failed — %s", exc)


def push(
    *,
    source_record_id: str,
    category: str,
    product_type: str,
    quantity: float,
    quantity_unit: str,
    location_lat: Optional[float],
    location_lng: Optional[float],
    confidence_overall: float,
    status: str,
    farm_id: Optional[str] = None,
    farmer_id: Optional[str] = None,
    photo_url: Optional[str] = None,
    ocr_raw_text: Optional[str] = None,
    expiry_date: Optional[str] = None,
) -> None:
    """
    Schedule a non-blocking push to Danil's endpoint.

    Call this immediately after db.commit() — it spawns an asyncio task
    so the caller returns instantly and the HTTP request runs in the
    background event loop.

    Parameters mirror the /marin/upload JSON schema.  location_lat /
    location_lng fall back to a central NL coordinate when None so that
    every record lands in *some* region rather than being dropped.
    """
    # Default to geographic centre of the Netherlands when location unknown
    lat = float(location_lat) if location_lat is not None else 52.37
    lng = float(location_lng) if location_lng is not None else 5.22

    mapped_category = _map_category(product_type, category)
    mapped_region = _map_region(lat, lng)
    
    qty = float(quantity) if quantity is not None else 0.0
    if quantity_unit and "crate" in quantity_unit.lower():
        qty *= 15.0  # estimate 15kg per crate
        
    # Removed strict guards to ensure every submit pushes to Danil
    if not mapped_category:
        mapped_category = "Overige"
    if not mapped_region:
        mapped_region = "SE"
    if confidence_overall is None:
        confidence_overall = 0.5

    # Check status according to confidence
    if confidence_overall < 0.6 and status == "confirmed":
        status = "pending"

    qty = float(quantity) if quantity is not None else 0.0
    qun = (quantity_unit or "kg").lower()
    
    if qun == "crates":
        qty *= 15.0
    elif qun == "boxes":
        qty *= 10.0
    elif qun == "units":
        qty *= 1.0  # fallback estimate

    payload = {
        "source_record_id": source_record_id or str(uuid.uuid4()),
        "category": category or "other",
        "product_type": product_type or "Unknown",
        "quantity": qty,
        "quantity_unit": "kg",
        "location_lat": lat,
        "location_lng": lng,
        "confidence_overall": float(confidence_overall),
        "status": status,
    }

    # Optional enrichment fields
    if farm_id:
        payload["farm_id"] = farm_id
    if farmer_id:
        payload["farmer_id"] = farmer_id
    if photo_url:
        payload["photo_url"] = photo_url
    if ocr_raw_text:
        payload["ocr_raw_text"] = ocr_raw_text
    if expiry_date:
        payload["expiry_date"] = expiry_date

    # Schedule without blocking — errors are caught inside _do_push
    try:
        loop = asyncio.get_event_loop()
        task = loop.create_task(_do_push(payload))
        _pending_tasks.add(task)
        task.add_done_callback(_pending_tasks.discard)
    except RuntimeError:
        # No running event loop (e.g. sync test context) — skip silently
        logger.debug("push_to_danil: no event loop, skipping push")
