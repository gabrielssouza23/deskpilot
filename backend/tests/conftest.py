import os

# Configure the app before it's imported: in-memory DB, no seed data, no real AI calls.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SEED_DEMO_DATA"] = "false"
os.environ["AI_PROVIDER"] = "rules"
os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-bytes-long"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.enums import Sentiment, TicketCategory, TicketPriority  # noqa: E402
from app.main import app  # noqa: E402
from app.services.triage import (  # noqa: E402
    TriageInput,
    TriageResult,
    TriageService,
    get_triage_service,
)

FAKE_RESULT = TriageResult(
    category=TicketCategory.TECHNICAL,
    priority=TicketPriority.HIGH,
    sentiment=Sentiment.NEGATIVE,
    language="en",
    summary="Customer reports the export button fails.",
    suggested_reply="Hi Jane, sorry about that! We're on it.\n\nDeskPilot Support",
)


class FakeProvider:
    name = "fake"

    def __init__(self) -> None:
        self.calls: list[TriageInput] = []

    def triage(self, ticket: TriageInput) -> TriageResult:
        self.calls.append(ticket)
        return FAKE_RESULT


@pytest.fixture(autouse=True)
def fresh_database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def fake_provider():
    provider = FakeProvider()
    app.dependency_overrides[get_triage_service] = lambda: TriageService(provider)
    yield provider
    app.dependency_overrides.clear()


@pytest.fixture
def client(fake_provider):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def agent(client):
    """Registers an agent; the auth cookie is stored on the client."""
    response = client.post(
        "/api/auth/register",
        json={"email": "agent@example.com", "full_name": "Ada Agent", "password": "s3cret-pass"},
    )
    assert response.status_code == 201
    return response.json()["user"]


@pytest.fixture
def make_ticket(client):
    def _make(**overrides):
        payload = {
            "customer_name": "Jane Doe",
            "customer_email": "jane@example.com",
            "subject": "Export button fails",
            "message": "When I click export nothing happens and I get an error.",
            **overrides,
        }
        response = client.post("/api/tickets", json=payload)
        assert response.status_code == 201, response.text
        return response.json()

    return _make
