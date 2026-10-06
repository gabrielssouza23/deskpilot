import os
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-please"


def _default_database_url() -> str:
    # Vercel's filesystem is read-only except /tmp, and /tmp is per instance and
    # wiped on cold starts. That's fine for a quick demo, but real deployments
    # should set DATABASE_URL to a Postgres database.
    return "sqlite:////tmp/deskpilot.db" if os.getenv("VERCEL") else "sqlite:///./deskpilot.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DeskPilot API"
    # POSTGRES_URL is what some Vercel storage integrations inject.
    database_url: str = Field(
        default_factory=_default_database_url,
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL"),
    )

    jwt_secret: str = DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8
    cookie_name: str = "access_token"
    cookie_secure: bool = False

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    ai_provider: Literal["auto", "claude", "rules"] = "auto"
    anthropic_api_key: str | None = None
    claude_model: str = "claude-opus-5-5"

    seed_demo_data: bool = False

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        # Hosted Postgres (Neon, Supabase, Render...) hands out postgres:// URLs.
        # SQLAlchemy needs the driver in the scheme to pick psycopg 3.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value.removeprefix(prefix)
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
