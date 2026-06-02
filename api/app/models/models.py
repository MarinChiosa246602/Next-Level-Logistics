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

class CargoOfferStatus(enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class CargoBookingStatus(enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    picked_up = "picked_up"
    delivered = "delivered"
    cancelled = "cancelled"

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

class CargoOffer(Base):
    __tablename__ = "cargo_offers"
    offer_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farmer_id = Column(String(36), ForeignKey("farmers.farmer_id"), nullable=False)
    license_plate = Column(String(20), nullable=False)
    vehicle_brand = Column(String(80), nullable=True)
    vehicle_model = Column(String(80), nullable=True)
    vehicle_year = Column(String(4), nullable=True)
    cargo_volume_total = Column(DECIMAL(8, 2), nullable=False)
    cargo_volume_available = Column(DECIMAL(8, 2), nullable=False)
    pickup_location_id = Column(String(36), ForeignKey("locations.location_id"), nullable=True)
    pickup_lat = Column(DECIMAL(10, 8), nullable=True)
    pickup_lng = Column(DECIMAL(11, 8), nullable=True)
    delivery_location_label = Column(String(200), nullable=False)
    delivery_lat = Column(DECIMAL(10, 8), nullable=False)
    delivery_lng = Column(DECIMAL(11, 8), nullable=False)
    delivery_window_start = Column(DateTime(timezone=True), nullable=False)
    delivery_window_end = Column(DateTime(timezone=True), nullable=False)
    driver_contact_phone = Column(String(20), nullable=True)
    driver_notes = Column(Text, nullable=True)
    status = Column(Enum(CargoOfferStatus), server_default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)

class CargoBooking(Base):
    __tablename__ = "cargo_bookings"
    booking_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    offer_id = Column(String(36), ForeignKey("cargo_offers.offer_id"), nullable=False)
    booked_by_farmer_id = Column(String(36), ForeignKey("farmers.farmer_id"), nullable=False)
    cargo_volume_booked = Column(DECIMAL(8, 2), nullable=False)
    pickup_notes = Column(Text, nullable=True)
    status = Column(Enum(CargoBookingStatus), server_default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

class CargoRoute(Base):
    __tablename__ = "cargo_routes"
    route_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    offer_id = Column(String(36), ForeignKey("cargo_offers.offer_id"), nullable=True)
    booking_id = Column(String(36), ForeignKey("cargo_bookings.booking_id"), nullable=True)
    distance_km = Column(DECIMAL(8, 2), nullable=True)
    duration_minutes = Column(String(10), nullable=True)
    polyline_encoded = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

class DriverRating(Base):
    __tablename__ = "driver_ratings"
    rating_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    driver_farmer_id = Column(String(36), ForeignKey("farmers.farmer_id"), nullable=False)
    reviewer_farmer_id = Column(String(36), ForeignKey("farmers.farmer_id"), nullable=False)
    booking_id = Column(String(36), ForeignKey("cargo_bookings.booking_id"), nullable=True)
    rating = Column(String(1), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
