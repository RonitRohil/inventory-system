import os

# Must be set before any app module is imported — database.py reads this at import time.
# load_dotenv() in main.py won't override an already-set env var (override=False by default).
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Query
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# In-memory SQLite shared across connections via StaticPool
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# SQLite doesn't enforce FK constraints by default — enable them so
# IntegrityError is raised on FK violations (mirrors PostgreSQL behaviour).
@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def patch_for_update(monkeypatch):
    """with_for_update() is a no-op in SQLite — patch it out for unit tests.
    Row-level locking behaviour requires a real PostgreSQL instance."""
    monkeypatch.setattr(Query, "with_for_update", lambda self, **kw: self)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def product(client):
    r = client.post(
        "/products",
        json={"name": "Widget", "sku": "WGT-001", "price": 10.0, "quantity": 50},
    )
    return r.json()


@pytest.fixture()
def customer(client):
    r = client.post(
        "/customers",
        json={"full_name": "Test User", "email": "test@example.com", "phone": "9876543210"},
    )
    return r.json()
