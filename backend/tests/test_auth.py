def test_register_sets_cookie_and_returns_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "New@Example.com", "full_name": "New Agent", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["token_type"] == "bearer"
    assert "access_token" in client.cookies
    assert client.get("/api/auth/me").json()["full_name"] == "New Agent"


def test_register_rejects_duplicate_email_case_insensitive(client, agent):
    response = client.post(
        "/api/auth/register",
        json={"email": "AGENT@example.com", "full_name": "Copy", "password": "password123"},
    )
    assert response.status_code == 409


def test_register_validates_password_length(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "full_name": "A", "password": "short"},
    )
    assert response.status_code == 422


def test_login_with_valid_credentials(client, agent):
    client.cookies.clear()
    response = client.post(
        "/api/auth/login", json={"email": "agent@example.com", "password": "s3cret-pass"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["id"] == agent["id"]


def test_login_rejects_wrong_password_and_unknown_email(client, agent):
    wrong_password = client.post(
        "/api/auth/login", json={"email": "agent@example.com", "password": "nope-nope"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "ghost@example.com", "password": "s3cret-pass"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    # Same message for both so the API doesn't reveal which emails exist.
    assert wrong_password.json() == unknown_email.json()


def test_me_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401


def test_bearer_token_works_without_cookie(client, agent):
    token = client.post(
        "/api/auth/login", json={"email": "agent@example.com", "password": "s3cret-pass"}
    ).json()["access_token"]
    client.cookies.clear()

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_invalid_token_is_rejected(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401


def test_logout_clears_cookie(client, agent):
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
