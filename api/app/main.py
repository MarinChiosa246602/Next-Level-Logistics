from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import records, infrastructure, uploads

app = FastAPI(title="Farmer Data Collection System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router, prefix="/v1", tags=["records"])
app.include_router(infrastructure.router, prefix="/v1", tags=["infrastructure"])
app.include_router(uploads.router, prefix="/v1", tags=["uploads"])

@app.get("/")
def root():
    return {"message": "Welcome to the Farmer Data Collection System API. Visit /docs for documentation."}
