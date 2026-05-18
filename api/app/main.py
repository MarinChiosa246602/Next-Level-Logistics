from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import records, infrastructure, uploads
from dotenv import load_dotenv
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

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

app.mount("/static/uploads", StaticFiles(directory="uploads"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to the Farmer Data Collection System API. Visit /docs for documentation."}
