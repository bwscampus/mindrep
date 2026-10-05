from app.config import Settings
from app.main import create_app

PROD_ENV = {
    "ENVIRONMENT": "production",
    "SECRET_KEY": "x" * 48,
    "RESEND_API_KEY": "re_test_key",
    "ALLOWED_HOSTS": "app.example.com",
    "PUBLIC_BASE_URL": "https://app.example.com",
}


async def test_security_headers_present(client):
    response = await client.get("/api/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
    assert response.headers["X-Request-ID"]


async def test_docs_hidden_in_production():
    app = create_app(Settings(**PROD_ENV))
    assert app.docs_url is None
    assert app.openapi_url is None


async def test_docs_available_outside_production(client):
    assert (await client.get("/docs")).status_code == 200


def test_production_rejects_placeholder_secret():
    import pytest

    with pytest.raises(ValueError, match="SECRET_KEY"):
        Settings(**{**PROD_ENV, "SECRET_KEY": "dev-insecure-change-me"})


def test_production_requires_email_key():
    import pytest

    with pytest.raises(ValueError, match="RESEND_API_KEY"):
        Settings(**{**PROD_ENV, "RESEND_API_KEY": ""})


def test_production_rejects_wildcard_hosts():
    import pytest

    with pytest.raises(ValueError, match="ALLOWED_HOSTS"):
        Settings(**{**PROD_ENV, "ALLOWED_HOSTS": "*"})


def test_railway_database_url_is_coerced_to_asyncpg():
    settings = Settings(DATABASE_URL="postgresql://u:p@host:5432/db")
    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")
    assert settings.sync_database_url.startswith("postgresql://")


def test_placeholder_email_key_is_flagged():
    settings = Settings(**{**PROD_ENV, "RESEND_API_KEY": "re_PLACEHOLDER_REPLACE_ME"})
    assert any("RESEND_API_KEY" in w for w in settings.startup_warnings())
    assert Settings(**PROD_ENV).startup_warnings() == []


async def test_well_formed_request_id_is_echoed(client):
    response = await client.get("/api/health", headers={"X-Request-ID": "abc-123"})
    assert response.headers["X-Request-ID"] == "abc-123"


async def test_malformed_request_id_is_replaced(client):
    supplied = "forged entry; level=CRITICAL"
    response = await client.get("/api/health", headers={"X-Request-ID": supplied})
    assert response.headers["X-Request-ID"] != supplied
