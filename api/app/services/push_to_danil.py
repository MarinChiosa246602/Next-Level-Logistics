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
_HEADERS = {"Authorization": f"Bearer {_TOKEN}"}
_TIMEOUT = 10  # seconds


async def _do_push(payload: dict) -> None:
    """Inner coroutine — performs the actual HTTP POST."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(_ENDPOINT, json=payload, headers=_HEADERS)
            resp.raise_for_status()
            logger.info(
                "push_to_danil: OK %s  source_record_id=%s",
                resp.status_code,
                payload.get("source_record_id"),
            )
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "push_to_danil: HTTP %s — %s",
            exc.response.status_code,
            exc.response.text[:200],
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

    payload = {
        "source_record_id": source_record_id or str(uuid.uuid4()),
        "category": category,
        "product_type": product_type,
        "quantity": float(quantity),
        "quantity_unit": quantity_unit,
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
        loop.create_task(_do_push(payload))
    except RuntimeError:
        # No running event loop (e.g. sync test context) — skip silently
        logger.debug("push_to_danil: no event loop, skipping push")
