"""MindRep's progress document round-trip."""

PROGRESS = {
    "completedLessons": ["1.1", "1.2"],
    "xp": 150,
    "level": 2,
    "streak": 3,
    "badges": ["first_lesson"],
    "coachChat": [{"role": "user", "text": "nervous before games"}],
}
PROFILE = {"name": "Jordan", "sport": "golf", "ageGroup": "14-15"}


async def login(client, credentials):
    return await client.post(
        "/api/auth/login",
        data={
            "username": credentials["email"],
            "password": credentials["password"],
        },
    )


async def test_state_requires_a_session(client):
    assert (await client.get("/api/state")).status_code == 401
    assert (await client.put("/api/state", json={"progress": {}})).status_code == 401


async def test_new_account_starts_with_no_profile(client, credentials, registered):
    await login(client, credentials)
    body = (await client.get("/api/state")).json()
    assert body["profile"] is None
    assert body["progress"] == {}
    assert body["email"] == credentials["email"]


async def test_progress_round_trips(client, credentials, registered):
    await login(client, credentials)

    saved = await client.put(
        "/api/state", json={"profile": PROFILE, "progress": PROGRESS}
    )
    assert saved.status_code == 200

    body = (await client.get("/api/state")).json()
    assert body["profile"] == PROFILE
    assert body["progress"] == PROGRESS
    assert body["progress"]["coachChat"][0]["text"] == "nervous before games"


async def test_progress_survives_signing_out_and_back_in(
    client, credentials, registered
):
    """The whole point of the change: progress outlives the browser session."""
    await login(client, credentials)
    await client.put("/api/state", json={"profile": PROFILE, "progress": PROGRESS})
    await client.post("/api/auth/logout")

    await login(client, credentials)
    body = (await client.get("/api/state")).json()
    assert body["progress"]["xp"] == 150
    assert body["profile"]["name"] == "Jordan"


async def test_one_athletes_progress_is_not_visible_to_another(
    client, credentials, registered
):
    await login(client, credentials)
    await client.put("/api/state", json={"profile": PROFILE, "progress": PROGRESS})
    await client.post("/api/auth/logout")

    other = {"email": "other@example.com", "password": "a different password"}
    assert (await client.post("/api/auth/register", json=other)).status_code == 201
    await login(client, other)

    body = (await client.get("/api/state")).json()
    assert body["profile"] is None
    assert body["progress"] == {}
