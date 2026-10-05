from httpx import ASGITransport, AsyncClient

from app.db import get_async_session


async def test_health_reports_ok(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_reports_503_when_the_database_is_down(app):
    class BrokenSession:
        async def execute(self, *_args, **_kwargs):
            raise ConnectionError("database unreachable")

    async def broken_session():
        yield BrokenSession()

    app.dependency_overrides[get_async_session] = broken_session
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        response = await client.get("/api/health")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
