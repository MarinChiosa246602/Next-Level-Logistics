from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env FIRST, before importing routers that depend on it
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import records, infrastructure, uploads, rdw_vehicles, cargo_offers
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Ensure rdw_vehicles logs are visible
logging.getLogger("app.routers.rdw_vehicles").setLevel(logging.DEBUG)

logger.info(f"Loading .env from: {env_path}")
logger.info(f"GEMINI_API_KEY is set: {bool(os.getenv('GEMINI_API_KEY'))}")

app = FastAPI(title="Farmer Data Collection System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(records.router, prefix="/v1", tags=["records"])
app.include_router(infrastructure.router, prefix="/v1", tags=["infrastructure"])
app.include_router(uploads.router, prefix="/v1", tags=["uploads"])
app.include_router(rdw_vehicles.router, prefix="/v1", tags=["vehicles"])
app.include_router(cargo_offers.router, prefix="/v1", tags=["cargo"])

app.mount("/static/uploads", StaticFiles(directory="uploads"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to the Farmer Data Collection System API. Visit /docs for documentation."}
