from sqlalchemy import Column, String, DateTime, ForeignKey, DECIMAL, Boolean, Enum, Text
from sqlalchemy.orm import declarative_base, relationship
import enum
import uuid

Base = declarative_base()

class LocationType(enum.Enum):
    field = "field"
    storage = "storage"
    transport = "transport"
    distribution_point = "distribution_point"

class RecordStatus(enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    flagged = "flagged"
    rejected = "rejected"

class InputMethod(enum.Enum):
    photo_only = "photo_only"
    form_only = "form_only"
    photo_plus_form = "photo_plus_form"

class ProductCategory(enum.Enum):
    vegetables = "vegetables"
    fruit = "fruit"
    dairy = "dairy"
    grain = "grain"
    other = "other"

class QuantityUnit(enum.Enum):
    crates = "crates"
    kg = "kg"
    units = "units"
    boxes = "boxes"

class Source(enum.Enum):
    photo = "photo"
    form = "form"

class ConditionRating(enum.Enum):
    good = "good"
    mixed = "mixed"
    damaged = "damaged"


class QuantitySource(enum.Enum):
    photo = "photo"
    form = "form"
    calculated = "calculated"

class Farm(Base):
    __tablename__ = "farms"
    farm_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    owner_name = Column(String(120), nullable=False)
    region = Column(String(80), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)

class Farmer(Base):
    __tablename__ = "farmers"
    farmer_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.farm_id"), nullable=False)
    name = Column(String(120), nullable=False)
    username = Column(String(50), nullable=True, unique=True)
    phone_number = Column(String(20), nullable=True)
    preferred_language = Column(String(2), server_default="nl", nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    last_active_at = Column(DateTime(timezone=True), nullable=True)

class Location(Base):
    __tablename__ = "locations"
    location_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.farm_id"), nullable=False)
    label = Column(String(100), nullable=False)
    type = Column(Enum(LocationType), nullable=False)
    lat = Column(DECIMAL(9, 6), nullable=True)
    lng = Column(DECIMAL(9, 6), nullable=True)
    active = Column(Boolean, server_default="true", nullable=False)

class Record(Base):
    __tablename__ = "records"
    record_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farmer_id = Column(String(36), ForeignKey("farmers.farmer_id"), nullable=False)
    farm_id = Column(String(36), ForeignKey("farms.farm_id"), nullable=False)
    location_id = Column(String(36), ForeignKey("locations.location_id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(RecordStatus), server_default="pending", nullable=False)
    input_method = Column(Enum(InputMethod), nullable=False)
    photo_url = Column(Text, nullable=True)
    ocr_raw_text = Column(Text, nullable=True)
    model_used = Column(String(60), nullable=True)

class RecordProduct(Base):
    __tablename__ = "record_products"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("records.record_id"), nullable=False)
    product_type = Column(String(80), nullable=False)
    product_category = Column(Enum(ProductCategory), nullable=False)
    variety = Column(String(80), nullable=True)
    quantity = Column(DECIMAL(10, 2), nullable=False)
    quantity_unit = Column(Enum(QuantityUnit), nullable=False)
    quantity_source = Column(Enum(QuantitySource), nullable=False)

class RecordCondition(Base):
    __tablename__ = "record_condition"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("records.record_id"), nullable=False)
    rating = Column(Enum(ConditionRating), nullable=False)
    notes = Column(String(200), nullable=True)
    source = Column(Enum(Source), nullable=False)

class RecordTraceability(Base):
    __tablename__ = "record_traceability"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("records.record_id"), nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    lot_number = Column(String(60), nullable=True)
    batch_id = Column(String(60), nullable=True)

class RecordConfidence(Base):
    __tablename__ = "record_confidence"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("records.record_id"), nullable=False)
    product_type = Column(DECIMAL(4, 3), nullable=False)
    quantity = Column(DECIMAL(4, 3), nullable=False)
    condition = Column(DECIMAL(4, 3), nullable=False)
    expiry_date = Column(DECIMAL(4, 3), nullable=True)
    location = Column(DECIMAL(4, 3), nullable=False)
    overall = Column(DECIMAL(4, 3), nullable=False)
    low_confidence_fields = Column(Text, nullable=True)
