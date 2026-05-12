from api.app.db.session import SessionLocal
from api.app.models import models
import uuid
from datetime import datetime

def seed_db():
    db = SessionLocal()
    try:
        # Create a Farm
        farm_id = uuid.uuid4()
        farm = models.Farm(
            farm_id=farm_id,
            name="Green Valley Farm",
            owner_name="Jan Jansen",
            region="North Brabant",
            created_at=datetime.utcnow()
        )
        db.add(farm)

        # Create a Farmer
        farmer_id = uuid.uuid4()
        farmer = models.Farmer(
            farmer_id=farmer_id,
            farm_id=farm_id,
            name="Pieter Farmer",
            phone_number="+31612345678",
            preferred_language="nl",
            created_at=datetime.utcnow(),
            last_active_at=datetime.utcnow()
        )
        db.add(farmer)

        # Create some Locations
        locations = [
            ("North storage shed", models.LocationType.storage),
            ("Field A", models.LocationType.field),
            ("Main gate", models.LocationType.distribution_point),
        ]

        for label, loc_type in locations:
            loc = models.Location(
                location_id=uuid.uuid4(),
                farm_id=farm_id,
                label=label,
                type=loc_type,
                active=True
            )
            db.add(loc)

        db.commit()
        print(f"Successfully seeded database.")
        print(f"Farm ID: {farm_id}")
        print(f"Farmer ID: {farmer_id}")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
