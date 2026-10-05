"""AUTH-3: the login limit holds per real client and its memory is bounded."""

from fastapi import Response
from starlette.requests import Request

from app.config import Settings
from app.rate_limit import RateLimitMiddleware, client_ip


async def login(client, credentials, headers=None):
    return await client.post(
        "/api/auth/login",
        data={"username": credentials["email"], "password": "wrong guess"},
        headers=headers or {},
    )


def _request(headers: dict[str, str], peer: str = "203.0.113.9") -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/auth/login",
            "headers": [
                (k.lower().encode(), v.encode()) for k, v in headers.items()
            ],
            "query_string": b"",
            "client": (peer, 1234),
        }
    )


def test_client_ip_uses_x_real_ip_and_ignores_forwarded_for():
    request = _request({"X-Real-IP": "198.51.100.7", "X-Forwarded-For": "1.2.3.4"})
    assert client_ip(request) == "198.51.100.7"


def test_client_ip_falls_back_to_the_socket_peer():
    assert client_ip(_request({"X-Forwarded-For": "1.2.3.4"})) == "203.0.113.9"


async def test_rotating_forwarded_for_does_not_bypass_the_limit(
    client, credentials, registered
):
    statuses = []
    for i in range(12):
        response = await login(
            client,
            credentials,
            {"X-Real-IP": "198.51.100.7", "X-Forwarded-For": f"10.0.0.{i}"},
        )
        statuses.append(response.status_code)
    assert 429 in statuses


async def test_limited_response_says_when_to_retry(client, credentials, registered):
    response = None
    for _ in range(12):
        response = await login(client, credentials, {"X-Real-IP": "198.51.100.8"})
    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) > 0


async def test_other_clients_are_not_locked_out(client, credentials, registered):
    for _ in range(12):
        await login(client, credentials, {"X-Real-IP": "198.51.100.9"})
    other = await login(client, credentials, {"X-Real-IP": "198.51.100.10"})
    assert other.status_code == 400  # wrong password, not rate limited


async def test_bucket_table_is_bounded():
    middleware = RateLimitMiddleware(app=None, settings=Settings(), max_buckets=3)

    async def call_next(_request):
        return Response("ok")

    for i in range(50):
        await middleware.dispatch(_request({"X-Real-IP": f"10.1.0.{i}"}), call_next)
    assert len(middleware._hits) == 3
