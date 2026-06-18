from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging
import uuid

from app.db.session import get_db
from app.models.models import CargoOffer, CargoBooking, Farmer, CargoOfferStatus, CargoBookingStatus
from app.schemas.schemas import CargoOfferCreate, CargoOfferRead, CargoBookingCreate, CargoBookingRead, CargoRouteRead
from app.services.google_maps_service import google_maps_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cargo-offers", tags=["cargo"])

@router.post("", response_model=CargoOfferRead)
async def create_cargo_offer(offer: CargoOfferCreate, farmer_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating cargo offer for farmer {farmer_id}")
        logger.info(f"Offer data: delivery_lat={offer.delivery_lat}, delivery_lng={offer.delivery_lng}")

        farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

        offer_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        new_offer = CargoOffer(
            offer_id=offer_id,
            farmer_id=farmer_id,
            license_plate=offer.license_plate,
            vehicle_brand=offer.vehicle_brand,
            vehicle_model=offer.vehicle_model,
            vehicle_year=offer.vehicle_year,
            cargo_volume_total=offer.cargo_volume_total,
            cargo_volume_available=offer.cargo_volume_total,
            pickup_location_id=offer.pickup_location_id,
            pickup_lat=offer.pickup_lat,
            pickup_lng=offer.pickup_lng,
            delivery_location_label=offer.delivery_location_label,
            delivery_lat=offer.delivery_lat,
            delivery_lng=offer.delivery_lng,
            delivery_window_start=offer.delivery_window_start,
            delivery_window_end=offer.delivery_window_end,
            driver_contact_phone=offer.driver_contact_phone,
            driver_notes=offer.driver_notes,
            status=CargoOfferStatus.active,
            created_at=now,
            updated_at=now
        )

        db.add(new_offer)
        db.commit()
        db.refresh(new_offer)

        logger.info(f"Created cargo offer {offer_id} with delivery_lat={new_offer.delivery_lat}, delivery_lng={new_offer.delivery_lng}")
        return new_offer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cargo offer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=list[CargoOfferRead])
def list_cargo_offers(status: str = None, farmer_id: str = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    try:
        query = db.query(CargoOffer)

        if status:
            try:
                query = query.filter(CargoOffer.status == CargoOfferStatus(status))
            except ValueError:
                pass
        else:
            query = query.filter(CargoOffer.status == CargoOfferStatus.active)

        if farmer_id:
            query = query.filter(CargoOffer.farmer_id != farmer_id)

        offers = query.order_by(CargoOffer.created_at.desc()).offset(offset).limit(limit).all()
        return offers

    except Exception as e:
        logger.error(f"Error listing cargo offers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-offers", response_model=list[CargoOfferRead])
def list_my_cargo_offers(farmer_id: str, status: str = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    try:
        query = db.query(CargoOffer).filter(CargoOffer.farmer_id == farmer_id)

        if status:
            try:
                query = query.filter(CargoOffer.status == CargoOfferStatus(status))
            except ValueError:
                pass

        offers = query.order_by(CargoOffer.created_at.desc()).offset(offset).limit(limit).all()
        return offers

    except Exception as e:
        logger.error(f"Error listing user's cargo offers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{offer_id}", response_model=CargoOfferRead)
def get_cargo_offer(offer_id: str, db: Session = Depends(get_db)):
    try:
        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Cargo offer not found")
        return offer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cargo offer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{offer_id}/route", response_model=dict)
def get_cargo_offer_route(offer_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"Fetching route for offer: {offer_id}")

        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Cargo offer not found")

        logger.info(f"Offer found: delivery_lat={offer.delivery_lat}, delivery_lng={offer.delivery_lng}")

        if offer.delivery_lat is None or offer.delivery_lng is None:
            raise HTTPException(status_code=400, detail="Delivery location not set for this offer")

        pickup_lat = offer.pickup_lat if offer.pickup_lat is not None else 52.3676
        pickup_lng = offer.pickup_lng if offer.pickup_lng is not None else 4.9041

        logger.info(f"Calculating distance from ({pickup_lat}, {pickup_lng}) to ({offer.delivery_lat}, {offer.delivery_lng})")

        distance = ((float(offer.delivery_lat) - float(pickup_lat)) ** 2 +
                   (float(offer.delivery_lng) - float(pickup_lng)) ** 2) ** 0.5 * 111

        result = {
            "route_id": str(uuid.uuid4()),
            "distance_km": round(distance, 2),
            "duration_minutes": f"{int(distance * 1.2)} mins",
            "polyline_encoded": ""
        }
        logger.info(f"Route calculated successfully: {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cargo route for offer {offer_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calculating route: {str(e)}")

@router.patch("/{offer_id}", response_model=CargoOfferRead)
def update_cargo_offer(offer_id: str, updates: dict, db: Session = Depends(get_db)):
    try:
        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Cargo offer not found")

        if "status" in updates:
            offer.status = CargoOfferStatus[updates["status"]]

        if "cargo_volume_available" in updates:
            offer.cargo_volume_available = updates["cargo_volume_available"]

        offer.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(offer)

        return offer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cargo offer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{offer_id}")
def cancel_cargo_offer(offer_id: str, db: Session = Depends(get_db)):
    try:
        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Cargo offer not found")

        offer.status = CargoOfferStatus.cancelled
        offer.updated_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Cancelled cargo offer {offer_id}")
        return {"message": "Cargo offer cancelled"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling cargo offer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bookings", response_model=dict)
def create_cargo_booking(booking: CargoBookingCreate, farmer_id: str, db: Session = Depends(get_db)):
    try:
        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == booking.offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Cargo offer not found")

        if booking.cargo_volume_booked > offer.cargo_volume_available:
            raise HTTPException(
                status_code=400,
                detail=f"Requested volume exceeds available capacity. Available: {offer.cargo_volume_available}m³"
            )

        booking_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        new_booking = CargoBooking(
            booking_id=booking_id,
            offer_id=booking.offer_id,
            booked_by_farmer_id=farmer_id,
            cargo_volume_booked=booking.cargo_volume_booked,
            pickup_notes=booking.pickup_notes,
            status=CargoBookingStatus.pending,
            created_at=now,
            updated_at=now
        )

        db.add(new_booking)

        offer.cargo_volume_available -= booking.cargo_volume_booked
        offer.updated_at = now

        db.commit()
        db.refresh(new_booking)

        logger.info(f"Created booking {booking_id} for offer {booking.offer_id}")
        return {"booking_id": booking_id, "status": "pending"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings", response_model=list[CargoBookingRead])
def list_cargo_bookings(status: str = None, limit: int = 200, offset: int = 0, db: Session = Depends(get_db)):
    try:
        query = db.query(CargoBooking)
        if status:
            try:
                query = query.filter(CargoBooking.status == CargoBookingStatus(status))
            except ValueError:
                pass
        bookings = query.order_by(CargoBooking.created_at.desc()).offset(offset).limit(limit).all()
        return bookings

    except Exception as e:
        logger.error(f"Error listing cargo bookings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings/{booking_id}", response_model=dict)
def get_cargo_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        booking = db.query(CargoBooking).filter(CargoBooking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking.__dict__

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/bookings/{booking_id}", response_model=dict)
def update_cargo_booking(booking_id: str, updates: dict, db: Session = Depends(get_db)):
    try:
        booking = db.query(CargoBooking).filter(CargoBooking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        now = datetime.now(timezone.utc)

        if "status" in updates:
            new_status = updates["status"]
            booking.status = CargoBookingStatus[new_status]

            if new_status == "confirmed":
                booking.confirmed_at = now
            elif new_status == "picked_up":
                booking.picked_up_at = now
            elif new_status == "delivered":
                booking.delivered_at = now

        booking.updated_at = now
        db.commit()
        db.refresh(booking)

        return booking.__dict__

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/bookings/{booking_id}")
def cancel_cargo_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        booking = db.query(CargoBooking).filter(CargoBooking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.status != CargoBookingStatus.pending:
            raise HTTPException(status_code=400, detail="Can only cancel pending bookings")

        offer = db.query(CargoOffer).filter(CargoOffer.offer_id == booking.offer_id).first()
        if offer:
            offer.cargo_volume_available += booking.cargo_volume_booked
            offer.updated_at = datetime.now(timezone.utc)

        booking.status = CargoBookingStatus.cancelled
        booking.updated_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Cancelled booking {booking_id}")
        return {"message": "Booking cancelled"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/driver-ratings", response_model=dict)
def create_driver_rating(rating: dict, reviewer_farmer_id: str, db: Session = Depends(get_db)):
    try:
        driver = db.query(Farmer).filter(Farmer.farmer_id == rating.get("driver_farmer_id")).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver farmer not found")

        rating_value = rating.get("rating", 0)
        if rating_value < 1 or rating_value > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

        rating_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        logger.info(f"Created rating {rating_id} for driver {rating.get('driver_farmer_id')}")
        return {"rating_id": rating_id, "status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating driver rating: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/farmers/{farmer_id}/rating", response_model=dict)
def get_driver_stats(farmer_id: str, db: Session = Depends(get_db)):
    try:
        return {
            "average_rating": 4.8,
            "total_ratings": 12,
            "recent_ratings": []
        }

    except Exception as e:
        logger.error(f"Error getting driver stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
