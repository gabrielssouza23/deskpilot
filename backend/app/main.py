import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import DEV_JWT_SECRET, get_settings
from app.database import Base, engine
from app.routers import auth, stats, tickets, users
from app.seed import seed_demo_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("deskpilot")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.jwt_secret == DEV_JWT_SECRET:
        logger.warning("JWT_SECRET is not set; using the insecure development default")
    if os.getenv("VERCEL") and settings.database_url.startswith("sqlite"):
        logger.warning("No DATABASE_URL on Vercel: using SQLite in /tmp, which resets often")
    # create_all is enough for a project this size; Alembic is on the roadmap.
    Base.metadata.create_all(engine)
    if settings.seed_demo_data:
        seed_demo_data()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="REST API for DeskPilot, a helpdesk that triages tickets with AI.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for module in (auth, tickets, stats, users):
        app.include_router(module.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
