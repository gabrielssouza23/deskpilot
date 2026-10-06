from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def build_engine(url: str):
    if url.startswith("sqlite"):
        # In-memory SQLite needs a single shared connection, otherwise every
        # session would see its own empty database.
        pool = {"poolclass": StaticPool} if ":memory:" in url else {}
        return create_engine(url, connect_args={"check_same_thread": False}, **pool)
    return create_engine(url, pool_pre_ping=True)


engine = build_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
