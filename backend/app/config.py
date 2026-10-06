from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-please"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DeskPilot API"
    database_url: str = "sqlite:///./deskpilot.db"

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

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
