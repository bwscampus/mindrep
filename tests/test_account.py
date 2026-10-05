"""AUTH-5 / AUTH-6: account changes need the current password; deletion works."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.auth.models import AccessToken, User
from app.config import settings
from app.models import UserState


async def login(client, credentials):
    return await client.post(
        "/api/auth/login",
        data={
            "username": credentials["email"],
            "password": credentials["password"],
        },
    )


async def count(engine, model) -> int:
    async with async_sessionmaker(engine)() as session:
        return await session.scalar(select(func.count()).select_from(model))


async def delete_me(client, password):
    return await client.request(
        "DELETE", "/api/users/me", json={"password": password}
    )


async def test_delete_requires_a_session(client):
    assert (await delete_me(client, "anything")).status_code == 401


async def test_delete_requires_the_password(client, engine, credentials, registered):
    await login(client, credentials)
    response = await delete_me(client, "not the password")
    assert response.status_code == 400
    assert (await client.get("/api/users/me")).status_code == 200
    assert await count(engine, User) == 1


async def test_delete_removes_the_account_and_its_data(
    client, engine, credentials, registered
):
    await login(client, credentials)
    await client.put("/api/state", json={"profile": {"name": "J"}, "progress": {}})
    assert await count(engine, UserState) == 1

    response = await delete_me(client, credentials["password"])
    assert response.status_code == 204
    assert 'session=""' in response.headers["set-cookie"]

    assert await count(engine, User) == 0
    assert await count(engine, UserState) == 0
    assert await count(engine, AccessToken) == 0
    assert (await login(client, credentials)).status_code == 400


async def test_password_change_requires_current_password(
    client, credentials, registered
):
    await login(client, credentials)
    missing = await client.patch(
        "/api/users/me", json={"password": "a brand new password"}
    )
    wrong = await client.patch(
        "/api/users/me",
        json={"password": "a brand new password", "current_password": "nope"},
    )
    assert missing.status_code == wrong.status_code == 400
    assert (await login(client, credentials)).status_code == 204


async def test_email_change_requires_current_password(
    client, credentials, registered
):
    await login(client, credentials)
    response = await client.patch(
        "/api/users/me", json={"email": "attacker@example.com"}
    )
    assert response.status_code == 400
    me = await client.get("/api/users/me")
    assert me.json()["email"] == credentials["email"]


async def test_password_change_signs_out_other_sessions_only(
    client, credentials, registered
):
    other_device = (await login(client, credentials)).cookies[
        settings.SESSION_COOKIE_NAME
    ]
    this_device = (await login(client, credentials)).cookies[
        settings.SESSION_COOKIE_NAME
    ]

    response = await client.patch(
        "/api/users/me",
        json={
            "password": "a brand new password",
            "current_password": credentials["password"],
        },
    )
    assert response.status_code == 200, response.text
    assert "current_password" not in response.json()

    client.cookies.set(settings.SESSION_COOKIE_NAME, this_device)
    assert (await client.get("/api/users/me")).status_code == 200
    client.cookies.set(settings.SESSION_COOKIE_NAME, other_device)
    assert (await client.get("/api/users/me")).status_code == 401
