from fastapi import FastAPI
from api.app.routers import records, infrastructure

app = FastAPI(title="Farmer Data Collection System API")

app.include_router(records.router, prefix="/v1", tags=["records"])
app.include_router(infrastructure.router, prefix="/v1", tags=["infrastructure"])

@app.get("/")
def root():
    return {"message": "Welcome to the Farmer Data Collection System API. Visit /docs for documentation."}
