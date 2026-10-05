"""DB-8: access_tokens stores only a hash of each session token."""

import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.auth.backend import hash_token
from app.auth.models import AccessToken
from app.config import settings


async def login(client, credentials):
    response = await client.post(
        "/api/auth/login",
        data={
            "username": credentials["email"],
            "password": credentials["password"],
        },
    )
    assert response.status_code == 204, response.text
    return response.cookies[settings.SESSION_COOKIE_NAME]


async def stored_tokens(engine) -> list[str]:
    async with async_sessionmaker(engine)() as session:
        return list(await session.scalars(select(AccessToken.token)))


def test_hash_token_shape():
    raw = secrets.token_urlsafe()
    hashed = hash_token(raw)
    assert len(hashed) == 43  # fits access_tokens.token String(43)
    assert hashed != raw
    assert hash_token(raw) == hashed  # deterministic
    assert "=" not in hashed and "+" not in hashed and "/" not in hashed


async def test_database_holds_the_hash_not_the_cookie(
    client, engine, credentials, registered
):
    cookie = await login(client, credentials)
    assert await stored_tokens(engine) == [hash_token(cookie)]


async def test_hashed_session_authenticates_and_logout_removes_it(
    client, engine, credentials, registered
):
    await login(client, credentials)
    me = await client.get("/api/users/me")
    assert me.status_code == 200
    assert me.json()["email"] == credentials["email"]

    assert (await client.post("/api/auth/logout")).status_code == 204
    assert await stored_tokens(engine) == []
    assert (await client.get("/api/users/me")).status_code == 401


async def test_stored_hash_is_not_a_usable_cookie(
    client, engine, credentials, registered
):
    await login(client, credentials)
    [stored] = await stored_tokens(engine)

    # What a database reader would see cannot be replayed as a session.
    client.cookies.set(settings.SESSION_COOKIE_NAME, stored)
    assert (await client.get("/api/users/me")).status_code == 401
