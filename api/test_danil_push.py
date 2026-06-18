import httpx
import asyncio

import uuid

async def test():
    payload = {
        'source_record_id': str(uuid.uuid4()),
        'product_type': 'Apple',
        'category': 'other',
        'quantity': 10,
        'quantity_unit': 'crates',
        'quantity_kg': 0.5,
        'location_lat': 52.3,
        'location_lng': 5.2,
        'confidence_overall': 1.0,
        'status': 'pending',
        'farm_id': 'c09e60d4-21a5-43aa-9f4b-71a0ec62f255',
        'farmer_id': 'ef51336f-333d-453c-aa3f-9015abcea3f3'
    }
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer Id6sBkF14gzOEpuvFNXSBNJfUG5Jhu_oMy3cRftkGbs'
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post('https://sfsc-bot.duckdns.org/marin/upload', json=payload, headers=headers)
        print(resp.status_code, resp.text)

asyncio.run(test())
