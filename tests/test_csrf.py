"""Cross-site request checks on the cookie-authenticated API (rule API-6)."""

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def bare_client(app):
    """A client that sends no Origin header unless a test adds one."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac


def form_login(credentials):
    return {"username": credentials["email"], "password": credentials["password"]}


async def test_cross_site_login_is_blocked(client, credentials, registered):
    response = await client.post(
        "/api/auth/login",
        data=form_login(credentials),
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403
    assert "set-cookie" not in response.headers


async def test_same_site_login_works(client, credentials, registered):
    response = await client.post("/api/auth/login", data=form_login(credentials))
    assert response.status_code == 204


async def test_cross_site_referer_without_origin_is_blocked(
    bare_client, credentials, registered
):
    response = await bare_client.post(
        "/api/auth/login",
        data=form_login(credentials),
        headers={"Referer": "https://evil.example/page"},
    )
    assert response.status_code == 403


async def test_same_site_referer_without_origin_works(
    bare_client, credentials, registered
):
    response = await bare_client.post(
        "/api/auth/login",
        data=form_login(credentials),
        headers={"Referer": "http://testserver/login"},
    )
    assert response.status_code == 204


async def test_form_post_with_no_origin_or_referer_is_blocked(
    bare_client, credentials, registered
):
    # A cross-site <form> can strip Referer (referrerpolicy=no-referrer) and
    # some contexts send no Origin; a form body with neither is refused.
    response = await bare_client.post("/api/auth/login", data=form_login(credentials))
    assert response.status_code == 403


async def test_null_origin_form_post_is_blocked(bare_client, credentials, registered):
    # Sandboxed iframes and some redirects send `Origin: null`.
    response = await bare_client.post(
        "/api/auth/login", data=form_login(credentials), headers={"Origin": "null"}
    )
    assert response.status_code == 403


async def test_json_post_without_origin_is_allowed(bare_client):
    # application/json can't be sent cross-site without a CORS preflight, so
    # non-browser clients (scripts, health tools) may omit Origin.
    response = await bare_client.post(
        "/api/auth/register",
        json={"email": "script@example.com", "password": "correct horse battery"},
    )
    assert response.status_code == 201


async def test_cross_site_json_write_is_blocked(client):
    response = await client.post(
        "/api/auth/register",
        json={"email": "x@example.com", "password": "correct horse battery"},
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403


async def test_safe_methods_are_not_checked(client):
    response = await client.get(
        "/api/health", headers={"Origin": "https://evil.example"}
    )
    assert response.status_code == 200


async def test_blocked_response_still_has_security_headers(client, credentials):
    response = await client.post(
        "/api/auth/login",
        data=form_login(credentials),
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403
    assert response.headers["X-Frame-Options"] == "DENY"
