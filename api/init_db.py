from app.db.session import engine
from app.models import models

models.Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
