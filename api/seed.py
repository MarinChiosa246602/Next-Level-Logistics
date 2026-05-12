from app.db.session import SessionLocal, engine
from app.models import models
import uuid
from datetime import datetime

def seed_db():
    # Create tables
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Farm 1: De Walhoeve
        farm1_id = uuid.uuid4()
        farm1 = models.Farm(
            farm_id=farm1_id,
            name="De Walhoeve",
            owner_name="Owner Walhoeve",
            region="Goirle",
            created_at=datetime.utcnow()
        )
        db.add(farm1)

        # Farm 2: De Dobbelhoeve
        farm2_id = uuid.uuid4()
        farm2 = models.Farm(
            farm_id=farm2_id,
            name="De Dobbelhoeve",
            owner_name="Owner Dobbelhoeve",
            region="Udenhout",
            created_at=datetime.utcnow()
        )
        db.add(farm2)

        # Hub: Central Hub
        hub_id = uuid.uuid4()
        hub = models.Farm(
            farm_id=hub_id,
            name="Central Hub — Udenhout · Brabants Streekgoed & The Food Directors",
            owner_name="Hub Manager",
            region="Udenhout",
            created_at=datetime.utcnow()
        )
        db.add(hub)

        # Farmer for Walhoeve
        farmer1_id = uuid.uuid4()
        farmer1 = models.Farmer(
            farmer_id=farmer1_id,
            farm_id=farm1_id,
            name="Farmer Walhoeve",
            phone_number="+31611111111",
            preferred_language="nl",
            created_at=datetime.utcnow(),
            last_active_at=datetime.utcnow()
        )
        db.add(farmer1)

        # Farmer for Dobbelhoeve
        farmer2_id = uuid.uuid4()
        farmer2 = models.Farmer(
            farmer_id=farmer2_id,
            farm_id=farm2_id,
            name="Farmer Dobbelhoeve",
            phone_number="+31622222222",
            preferred_language="nl",
            created_at=datetime.utcnow(),
            last_active_at=datetime.utcnow()
        )
        db.add(farmer2)

        # Locations for Walhoeve (includes crops)
        walhoeve_locs = [
            ("Carrot Field", models.LocationType.field),
            ("Tomato Greenhouse", models.LocationType.field),
            ("Storage Shed", models.LocationType.storage),
            ("Main Gate", models.LocationType.distribution_point),
        ]
        for label, loc_type in walhoeve_locs:
            db.add(models.Location(location_id=uuid.uuid4(), farm_id=farm1_id, label=label, type=loc_type, active=True))

        # Locations for Dobbelhoeve
        dobbelhoeve_locs = [
            ("Pasture A", models.LocationType.field),
            ("Milking Parlor", models.LocationType.storage),
            ("Main Gate", models.LocationType.distribution_point),
        ]
        for label, loc_type in dobbelhoeve_locs:
            db.add(models.Location(location_id=uuid.uuid4(), farm_id=farm2_id, label=label, type=loc_type, active=True))

        # Locations for Hub
        hub_locs = [
            ("Receiving Bay", models.LocationType.distribution_point),
            ("Cold Storage", models.LocationType.storage),
        ]
        for label, loc_type in hub_locs:
            db.add(models.Location(location_id=uuid.uuid4(), farm_id=hub_id, label=label, type=loc_type, active=True))

        db.commit()
        print(f"Successfully seeded database with real farm data.")
        print(f"Walhoeve Farm ID: {farm1_id} | Farmer ID: {farmer1_id}")
        print(f"Dobbelhoeve Farm ID: {farm2_id} | Farmer ID: {farmer2_id}")
        print(f"Hub ID: {hub_id}")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
