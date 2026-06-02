#!/usr/bin/env python3
"""Initialize database with all required tables."""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import engine
from app.models.models import Base

def init_db():
    """Create all tables in the database."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database initialized successfully!")

if __name__ == '__main__':
    init_db()
