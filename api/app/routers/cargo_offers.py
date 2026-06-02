from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timezone
import logging
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.models.models import (
    CargoOffer, CargoBooking, CargoRoute, DriverRating,
    Farmer, Farm, Location, CargoOfferStatus, CargoBookingStatus
)
from app.schemas.schemas import (
    CargoOfferCreate, CargoOfferRead, CargoBookingCreate, CargoBookingRead,
    CargoRouteRead, DriverRatingCreate, DriverRatingRead, DriverStatsRead
)
from app.services.google_maps_service import google_maps_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cargo-offers", tags=["cargo"])

@router.post("/", response_model=CargoOfferRead)
async def create_cargo_offer(
    offer: CargoOfferCreate,
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Create a new cargo space offer"""
    try:
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

        # Calculate and cache route
        try:
            route_data = await google_maps_service.get_route(
                offer.pickup_lat or float(farmer.farm_id[:2]),
                offer.pickup_lng or float(farmer.farm_id[2:4]),
                offer.delivery_lat,
                offer.delivery_lng
            )

            if route_data:
                route_id = str(uuid.uuid4())
                new_route = CargoRoute(
                    route_id=route_id,
                    offer_id=offer_id,
                    distance_km=route_data.get("distance_km"),
                    duration_minutes=route_data.get("duration_minutes"),
                    polyline_encoded=route_data.get("polyline_encoded"),
                    updated_at=now,
                    expires_at=datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
                )
                db.add(new_route)
                db.commit()
        except Exception as e:
            logger.error(f"Error creating route cache: {str(e)}")

        logger.info(f"Created cargo offer {offer_id} for farmer {farmer_id}")
        return new_offer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cargo offer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[CargoOfferRead])
def list_cargo_offers(
    status: Optional[str] = None,
    farmer_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List available cargo offers with optional filters"""
    try:
        query = db.query(CargoOffer)

        if status:
            query = query.filter(CargoOffer.status == status)
        else:
            query = query.filter(CargoOffer.status == CargoOfferStatus.active)

        if farmer_id:
            query = query.filter(CargoOffer.farmer_id != farmer_id)

        offers = query.order_by(CargoOffer.created_at.desc()).offset(offset).limit(limit).all()
        return offers

    except Exception as e:
        logger.error(f"Error listing cargo offers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-offers", response_model=List[CargoOfferRead])
def list_my_cargo_offers(
    farmer_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List current user's cargo offers"""
    try:
        query = db.query(CargoOffer).filter(CargoOffer.farmer_id == farmer_id)

        if status:
            query = query.filter(CargoOffer.status == status)

        offers = query.order_by(CargoOffer.created_at.desc()).offset(offset).limit(limit).all()
        return offers

    except Exception as e:
        logger.error(f"Error listing user's cargo offers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{offer_id}", response_model=CargoOfferRead)
def get_cargo_offer(offer_id: str, db: Session = Depends(get_db)):
    """Get detailed cargo offer information"""
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

@router.get("/{offer_id}/route", response_model=CargoRouteRead)
def get_cargo_offer_route(offer_id: str, db: Session = Depends(get_db)):
    """Get route details for a cargo offer"""
    try:
        route = db.query(CargoRoute).filter(CargoRoute.offer_id == offer_id).first()
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        return route

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cargo route: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{offer_id}", response_model=CargoOfferRead)
def update_cargo_offer(
    offer_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update cargo offer status or available capacity"""
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
    """Cancel a cargo offer"""
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

@router.post("/bookings", response_model=CargoBookingRead)
def create_cargo_booking(
    booking: CargoBookingCreate,
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Create a booking for cargo space"""
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
        return new_booking

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings/{booking_id}", response_model=CargoBookingRead)
def get_cargo_booking(booking_id: str, db: Session = Depends(get_db)):
    """Get booking details"""
    try:
        booking = db.query(CargoBooking).filter(CargoBooking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/bookings/{booking_id}", response_model=CargoBookingRead)
def update_cargo_booking(
    booking_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update booking status (confirm, pick_up, deliver)"""
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

        return booking

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cargo booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/bookings/{booking_id}")
def cancel_cargo_booking(booking_id: str, db: Session = Depends(get_db)):
    """Cancel a cargo booking and refund capacity"""
    try:
        booking = db.query(CargoBooking).filter(CargoBooking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.status != CargoBookingStatus.pending:
            raise HTTPException(
                status_code=400,
                detail="Can only cancel pending bookings"
            )

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

@router.post("/driver-ratings", response_model=DriverRatingRead)
def create_driver_rating(
    rating: DriverRatingCreate,
    reviewer_farmer_id: str,
    db: Session = Depends(get_db)
):
    """Rate a driver after delivery"""
    try:
        driver = db.query(Farmer).filter(Farmer.farmer_id == rating.driver_farmer_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver farmer not found")

        if rating.rating < 1 or rating.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

        rating_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        new_rating = DriverRating(
            rating_id=rating_id,
            driver_farmer_id=rating.driver_farmer_id,
            reviewer_farmer_id=reviewer_farmer_id,
            booking_id=rating.booking_id,
            rating=str(rating.rating),
            comment=rating.comment,
            created_at=now
        )

        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)

        logger.info(f"Created rating {rating_id} for driver {rating.driver_farmer_id}")
        return new_rating

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating driver rating: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/farmers/{farmer_id}/rating", response_model=DriverStatsRead)
def get_driver_stats(farmer_id: str, db: Session = Depends(get_db)):
    """Get driver's rating statistics"""
    try:
        ratings = db.query(DriverRating).filter(
            DriverRating.driver_farmer_id == farmer_id
        ).order_by(DriverRating.created_at.desc()).limit(10).all()

        if not ratings:
            return {
                "average_rating": None,
                "total_ratings": 0,
                "recent_ratings": []
            }

        rating_values = [int(r.rating) for r in ratings]
        average_rating = sum(rating_values) / len(rating_values)

        recent_ratings = [
            DriverRatingRead(
                rating_id=r.rating_id,
                driver_farmer_id=r.driver_farmer_id,
                reviewer_farmer_id=r.reviewer_farmer_id,
                rating=int(r.rating),
                comment=r.comment,
                created_at=r.created_at
            )
            for r in ratings
        ]

        return {
            "average_rating": round(average_rating, 2),
            "total_ratings": len(ratings),
            "recent_ratings": recent_ratings
        }

    except Exception as e:
        logger.error(f"Error getting driver stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
