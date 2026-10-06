import pytest

from app.main import app
from app.services.triage import TriageError, TriageService, get_triage_service


def test_public_ticket_is_created_and_triaged(client, fake_provider, make_ticket, agent):
    created = make_ticket(customer_email="Jane@Example.COM")

    assert created["status"] == "open"
    # TestClient runs background tasks before returning, so triage is already done.
    assert fake_provider.calls[0].subject == "Export button fails"
    detail = client.get(f"/api/tickets/{created['id']}").json()
    assert detail["customer_email"] == "jane@example.com"
    assert detail["triage_status"] == "done"
    assert detail["triage_provider"] == "fake"
    assert detail["priority"] == "high"
    assert detail["category"] == "technical"
    assert detail["suggested_reply"].startswith("Hi Jane")


@pytest.mark.parametrize(
    "field, value",
    [("customer_email", "not-an-email"), ("message", "too short"), ("subject", "")],
)
def test_ticket_validation(client, make_ticket, field, value):
    payload = {
        "customer_name": "Jane",
        "customer_email": "jane@example.com",
        "subject": "Valid subject",
        "message": "A message that is long enough.",
        field: value,
    }
    assert client.post("/api/tickets", json=payload).status_code == 422


def test_listing_requires_authentication(client, make_ticket):
    make_ticket()
    assert client.get("/api/tickets").status_code == 401


def test_list_filters_search_and_pagination(client, make_ticket, agent):
    first = make_ticket(subject="Invoice is wrong")
    make_ticket(subject="App crashes on login")
    make_ticket(subject="Another invoice question")
    client.patch(f"/api/tickets/{first['id']}", json={"status": "resolved"})

    search = client.get("/api/tickets", params={"q": "invoice"}).json()
    assert search["total"] == 2

    resolved = client.get("/api/tickets", params={"status": "resolved"}).json()
    assert [ticket["id"] for ticket in resolved["items"]] == [first["id"]]

    page = client.get("/api/tickets", params={"page_size": 2, "page": 2}).json()
    assert page["total"] == 3
    assert len(page["items"]) == 1


def test_sort_by_priority_puts_urgent_first(client, make_ticket, agent):
    low = make_ticket()
    urgent = make_ticket()
    client.patch(f"/api/tickets/{low['id']}", json={"priority": "low"})
    client.patch(f"/api/tickets/{urgent['id']}", json={"priority": "urgent"})

    items = client.get("/api/tickets", params={"sort": "priority"}).json()["items"]
    assert [item["priority"] for item in items] == ["urgent", "low"]


def test_update_assigns_and_unassigns(client, make_ticket, agent):
    ticket = make_ticket()

    assigned = client.patch(f"/api/tickets/{ticket['id']}", json={"assignee_id": agent["id"]})
    assert assigned.json()["assignee"]["id"] == agent["id"]

    unassigned = client.patch(f"/api/tickets/{ticket['id']}", json={"assignee_id": None})
    assert unassigned.json()["assignee"] is None


def test_update_ignores_omitted_fields(client, make_ticket, agent):
    ticket = make_ticket()
    client.patch(f"/api/tickets/{ticket['id']}", json={"assignee_id": agent["id"]})

    response = client.patch(f"/api/tickets/{ticket['id']}", json={"status": "pending"})
    assert response.json()["status"] == "pending"
    assert response.json()["assignee"]["id"] == agent["id"]


def test_update_rejects_unknown_assignee_and_ticket(client, make_ticket, agent):
    ticket = make_ticket()
    unknown_assignee = client.patch(f"/api/tickets/{ticket['id']}", json={"assignee_id": 999})
    assert unknown_assignee.status_code == 422
    assert client.patch("/api/tickets/999", json={"status": "closed"}).status_code == 404


def test_reply_updates_status_and_assigns_author(client, make_ticket, agent):
    ticket = make_ticket()

    response = client.post(
        f"/api/tickets/{ticket['id']}/replies",
        json={"body": "We're looking into it.", "status": "pending"},
    )

    assert response.status_code == 201
    detail = response.json()
    assert detail["status"] == "pending"
    assert detail["assignee"]["id"] == agent["id"]
    assert detail["replies"][0]["body"] == "We're looking into it."
    assert detail["replies"][0]["author"]["full_name"] == "Ada Agent"


def test_retriage_runs_provider_again(client, fake_provider, make_ticket, agent):
    ticket = make_ticket()
    client.patch(f"/api/tickets/{ticket['id']}", json={"priority": "low"})

    response = client.post(f"/api/tickets/{ticket['id']}/triage")

    assert response.status_code == 202
    assert len(fake_provider.calls) == 2
    assert client.get(f"/api/tickets/{ticket['id']}").json()["priority"] == "high"


def test_failed_ai_triage_falls_back_to_rules(client, make_ticket, agent):
    class BrokenProvider:
        name = "claude"

        def triage(self, ticket):
            raise TriageError("rate limited")

    app.dependency_overrides[get_triage_service] = lambda: TriageService(BrokenProvider())
    ticket = make_ticket(subject="Charged twice", message="I was charged twice this month.")

    detail = client.get(f"/api/tickets/{ticket['id']}").json()
    assert detail["triage_status"] == "done"
    assert detail["triage_provider"] == "rules"
    assert detail["category"] == "billing"


def test_stats_are_zero_filled(client, make_ticket, agent):
    make_ticket()
    stats = client.get("/api/stats").json()

    assert stats["total"] == 1
    assert stats["unassigned_open"] == 1
    assert stats["by_status"] == {"open": 1, "pending": 0, "resolved": 0, "closed": 0}
    assert stats["by_priority"]["high"] == 1
    assert stats["by_priority"]["urgent"] == 0


def test_list_agents(client, agent):
    response = client.get("/api/users")
    assert [user["email"] for user in response.json()] == ["agent@example.com"]
