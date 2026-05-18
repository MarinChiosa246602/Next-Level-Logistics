from app.db.session import engine
from app.models import models

# Drop all tables
models.Base.metadata.drop_all(bind=engine)
print("All tables dropped!")

# Recreate all tables
models.Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
