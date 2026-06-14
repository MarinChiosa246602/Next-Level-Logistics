"""
seed_push_danil.py
One-shot script: push ALL existing records from farmer_data.db to
Danil's real-time matching endpoint.  Run from api/ directory.
"""
import sqlite3
import asyncio
import httpx

ENDPOINT = "https://sfsc-bot.duckdns.org/marin/upload"
TOKEN    = "Id6sBkF14gzOEpuvFNXSBNJfUG5Jhu_oMy3cRftkGbs"
HEADERS  = {"Authorization": f"Bearer {TOKEN}"}

conn = sqlite3.connect("farmer_data.db")
cur  = conn.cursor()
cur.execute("""
    SELECT
        r.record_id, r.farmer_id, r.farm_id, r.status,
        p.product_type, p.product_category, p.quantity, p.quantity_unit,
        l.lat, l.lng,
        c.overall,
        r.photo_url, r.ocr_raw_text
    FROM records r
    LEFT JOIN record_products p   ON p.record_id = r.record_id
    LEFT JOIN locations l          ON l.location_id = r.location_id
    LEFT JOIN record_confidence c  ON c.record_id = r.record_id
    ORDER BY r.created_at DESC
    LIMIT 50
""")
rows = cur.fetchall()
conn.close()

async def push_all():
    async with httpx.AsyncClient(timeout=15) as client:
        for row in rows:
            (rec_id, farmer_id, farm_id, status,
             product_type, category, quantity, qty_unit,
             lat, lng, confidence,
             photo_url, ocr_text) = row

            payload = {
                "source_record_id": rec_id,
                "category":          category    or "other",
                "product_type":      product_type or "Unknown",
                "quantity":          float(quantity or 0),
                "quantity_unit":     qty_unit    or "kg",
                "location_lat":      float(lat)  if lat else 52.37,
                "location_lng":      float(lng)  if lng else 5.22,
                "confidence_overall": float(confidence or 0.8),
                "status":            status      or "pending",
                "farm_id":           farm_id,
                "farmer_id":         farmer_id,
            }
            if photo_url: payload["photo_url"]    = photo_url
            if ocr_text:  payload["ocr_raw_text"] = ocr_text

            try:
                resp = await client.post(ENDPOINT, json=payload, headers=HEADERS)
                print(f"[{resp.status_code}] {rec_id[:8]}... {product_type:20s} lat={lat} lng={lng}")
            except Exception as e:
                print(f"[ERR] {rec_id[:8]}... {e}")

asyncio.run(push_all())
print("\nDone.")
