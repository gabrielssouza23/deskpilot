import pytest

from app.config import Settings


@pytest.mark.parametrize(
    "url",
    [
        "postgres://user:pass@db.example.com/app?sslmode=require",
        "postgresql://user:pass@db.example.com/app?sslmode=require",
    ],
)
def test_hosted_postgres_urls_use_psycopg(monkeypatch, url):
    monkeypatch.setenv("DATABASE_URL", url)
    assert Settings().database_url == (
        "postgresql+psycopg://user:pass@db.example.com/app?sslmode=require"
    )


def test_postgres_url_from_vercel_integration(monkeypatch):
    monkeypatch.delenv("DATABASE_URL")
    monkeypatch.setenv("POSTGRES_URL", "postgres://u:p@neon.tech/db")
    assert Settings().database_url == "postgresql+psycopg://u:p@neon.tech/db"


def test_defaults_to_tmp_sqlite_on_vercel(monkeypatch):
    monkeypatch.delenv("DATABASE_URL")
    monkeypatch.delenv("POSTGRES_URL", raising=False)
    monkeypatch.setenv("VERCEL", "1")
    assert Settings(_env_file=None).database_url == "sqlite:////tmp/deskpilot.db"
