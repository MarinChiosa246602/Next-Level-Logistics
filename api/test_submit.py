import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

payload = {
    "farmer_id": "ef51336f-333d-453c-aa3f-9015abcea3f3",
    "location_id": "c09e60d4-21a5-43aa-9f4b-71a0ec62f255",
    "form_fields": {
        "product_type": "Apple",
        "quantity": 100,
        "quantity_unit": "kg"
    },
    "input_method": "form"
}

response = client.post("/v1/records", json=payload)
print(response.status_code, response.json())

# Wait a moment for background tasks to finish
asyncio.run(asyncio.sleep(2))
