from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class InputMethod(str, Enum):
    photo = "photo"
    form = "form"
    mixed = "mixed"

class QuantityUnit(str, Enum):
    crates = "crates"
    kg = "kg"
    units = "units"
    boxes = "boxes"

class ConditionRating(str, Enum):
    good = "good"
    mixed = "mixed"
    damaged = "damaged"

class PhotoPayload(BaseModel):
    file_url: Optional[str] = None
    taken_at: Optional[datetime] = None
    device_model: Optional[str] = None

class FormFields(BaseModel):
    product_type: Optional[str] = None
    quantity: Optional[float] = None
    quantity_unit: Optional[QuantityUnit] = None
    condition: Optional[ConditionRating] = None
    notes: Optional[str] = Field(None, max_length=200)

class FarmerSubmission(BaseModel):
    model_config = ConfigDict(str_to_lower=False, extra='ignore')

    farmer_id: UUID
    submitted_at: datetime
    input_method: InputMethod
    location_id: UUID
    photo: Optional[PhotoPayload] = None
    form_fields: FormFields

class SubmissionResponse(BaseModel):
    record_id: UUID
    status: str
    estimated_processing_ms: int
    message: str

class LocationRead(BaseModel):
    location_id: UUID
    label: str
    type: str

class LocationsResponse(BaseModel):
    locations: List[LocationRead]

class ProductInfo(BaseModel):
    type: str
    variety: Optional[str] = None
    category: str

class QuantityInfo(BaseModel):
    estimated: float
    unit: QuantityUnit
    source: str

class ConditionInfo(BaseModel):
    rating: ConditionRating
    notes: Optional[str] = None
    source: str

class ProvenanceInfo(BaseModel):
    farm_id: UUID
    location_id: UUID
    location_type: str
    location_label: str

class TraceabilityInfo(BaseModel):
    expiry_date: Optional[datetime] = None
    lot_number: Optional[str] = None
    batch_id: Optional[str] = None

class ConfidenceInfo(BaseModel):
    product_type: float
    quantity: float
    condition: float
    expiry_date: Optional[float] = None
    location: float
    overall: float

class ExtractionInfo(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    method: str
    photo_url: Optional[str] = None
    ocr_raw_text: Optional[str] = None
    model_used: Optional[str] = None
    confidence: ConfidenceInfo
    low_confidence_fields: List[str]

class ProcessedRecord(BaseModel):
    record_id: UUID
    farmer_id: UUID
    created_at: datetime
    updated_at: datetime
    status: str
    product: ProductInfo
    quantity: QuantityInfo
    condition: ConditionInfo
    provenance: ProvenanceInfo
    traceability: TraceabilityInfo
    extraction: ExtractionInfo
