"""Real-Postgres checks for DB-6 (restricted app role) and DB-8 (hashed tokens).

SQLite can't test roles, grants, or the migration's SQL hash, so these run
only when TEST_POSTGRES_URL points at a Postgres the tests may create a
scratch database and roles in, e.g.

    docker run -d --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine
    TEST_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/postgres uv run pytest tests/test_postgres.py

CI sets it (see .github/workflows/ci.yml).
"""

import os
import secrets
import subprocess
import sys
import uuid
from pathlib import Path

import pytest

from app.auth.backend import hash_token

asyncpg = pytest.importorskip("asyncpg")

ADMIN_URL = os.environ.get("TEST_POSTGRES_URL")
pytestmark = pytest.mark.skipif(
    not ADMIN_URL, reason="TEST_POSTGRES_URL not set (needs a real Postgres)"
)

ROOT = Path(__file__).resolve().parent.parent
TEST_DB = "mindrep_hardening_test"
# Deliberately awkward: quote, colon-word (SQLAlchemy bind syntax), percent.
PASSWORD = "it's:a %pass word"
HASH_SQL = (
    "rtrim(translate(encode(sha256(convert_to($1::text, 'UTF8')), 'base64'),"
    " '+/', '-_'), '=')"
)


def url_for(database: str, user: str | None = None, password: str | None = None):
    from sqlalchemy.engine import make_url

    url = make_url(ADMIN_URL).set(database=database)
    if user:
        url = url.set(username=user, password=password)
    return url.render_as_string(hide_password=False)


def run(*args: str, **env: str) -> subprocess.CompletedProcess:
    full_env = {
        **os.environ,
        "ENVIRONMENT": "test",
        "SECRET_KEY": "test-secret-key-that-is-long-enough-xxxx",
        "PUBLIC_BASE_URL": "http://testserver",
        **env,
    }
    if "APP_DB_PASSWORD" not in env:
        full_env.pop("APP_DB_PASSWORD", None)
    result = subprocess.run(
        [sys.executable, "-m", *args],
        cwd=ROOT,
        env=full_env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    return result


@pytest.fixture(scope="module")
def owner_url():
    """A fresh scratch database; roles are dropped afterwards."""

    async def setup():
        conn = await asyncpg.connect(ADMIN_URL)
        try:
            await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
            await conn.execute(f"CREATE DATABASE {TEST_DB}")
        finally:
            await conn.close()

    async def teardown():
        conn = await asyncpg.connect(ADMIN_URL)
        try:
            await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
            await conn.execute("DROP ROLE IF EXISTS app_rw_login")
            await conn.execute("DROP ROLE IF EXISTS app_rw")
        finally:
            await conn.close()

    import asyncio

    asyncio.run(setup())
    yield url_for(TEST_DB)
    asyncio.run(teardown())


async def test_sql_hash_matches_python_hash_token():
    conn = await asyncpg.connect(ADMIN_URL)
    try:
        for _ in range(20):
            raw = secrets.token_urlsafe()
            assert await conn.fetchval(f"SELECT {HASH_SQL}", raw) == hash_token(raw)
    finally:
        await conn.close()


async def test_migration_hashes_existing_sessions_in_place(owner_url):
    # Migrate with MIGRATION_DATABASE_URL while DATABASE_URL points elsewhere:
    # proves migrations use the owner URL when both are set.
    owner_env = {"MIGRATION_DATABASE_URL": owner_url, "DATABASE_URL": "sqlite+aiosqlite://"}
    run("alembic", "upgrade", "0002_mindrep_user_state", **owner_env)

    raw = secrets.token_urlsafe()
    user_id = uuid.uuid4()
    conn = await asyncpg.connect(owner_url)
    try:
        await conn.execute(
            "INSERT INTO users (id, email, hashed_password, is_active,"
            " is_superuser, is_verified) VALUES ($1, 'a@example.com', 'x',"
            " true, false, false)",
            user_id,
        )
        await conn.execute(
            "INSERT INTO access_tokens (token, user_id, created_at)"
            " VALUES ($1, $2, now())",
            raw,
            user_id,
        )
        run("alembic", "upgrade", "head", **owner_env)
        stored = await conn.fetchval("SELECT token FROM access_tokens")
    finally:
        await conn.close()

    assert stored == hash_token(raw)


async def test_app_role_can_read_write_but_not_change_schema(owner_url):
    run("alembic", "upgrade", "head", DATABASE_URL=owner_url)
    run("app.db_roles", DATABASE_URL=owner_url, APP_DB_PASSWORD=PASSWORD)
    # Idempotent: a second deploy changes nothing and doesn't fail.
    run("app.db_roles", DATABASE_URL=owner_url, APP_DB_PASSWORD=PASSWORD)

    app = await asyncpg.connect(url_for(TEST_DB, "app_rw_login", PASSWORD))
    try:
        flags = await app.fetchrow(
            "SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb"
            " FROM pg_roles WHERE rolname = current_user"
        )
        assert not any(flags.values())

        # The app's normal work: CRUD on its tables.
        user_id = uuid.uuid4()
        await app.execute(
            "INSERT INTO users (id, email, hashed_password, is_active,"
            " is_superuser, is_verified) VALUES ($1, 'b@example.com', 'x',"
            " true, false, false)",
            user_id,
        )
        await app.execute(
            "INSERT INTO user_state (user_id, profile, progress)"
            " VALUES ($1, '{}', '{}')",
            user_id,
        )
        await app.execute(
            "UPDATE user_state SET progress = '{\"xp\": 1}' WHERE user_id = $1",
            user_id,
        )
        assert await app.fetchval("SELECT count(*) FROM user_state") >= 1
        await app.execute("DELETE FROM users WHERE id = $1", user_id)

        # No DDL, no migration history.
        for ddl in (
            "CREATE TABLE sneaky (id int)",
            "DROP TABLE user_state",
            "ALTER TABLE users ADD COLUMN sneaky int",
            "TRUNCATE users",
            "SELECT * FROM alembic_version",
        ):
            with pytest.raises(asyncpg.InsufficientPrivilegeError):
                await app.execute(ddl)
    finally:
        await app.close()


async def test_future_tables_and_password_rotation(owner_url):
    run("alembic", "upgrade", "head", DATABASE_URL=owner_url)
    run("app.db_roles", DATABASE_URL=owner_url, APP_DB_PASSWORD=PASSWORD)

    # A table a later migration creates (as the owner) is usable at once.
    owner = await asyncpg.connect(owner_url)
    try:
        await owner.execute("CREATE TABLE later_feature (id serial PRIMARY KEY, note text)")
    finally:
        await owner.close()

    app = await asyncpg.connect(url_for(TEST_DB, "app_rw_login", PASSWORD))
    try:
        await app.execute("INSERT INTO later_feature (note) VALUES ('ok')")
        assert await app.fetchval("SELECT count(*) FROM later_feature") == 1
    finally:
        await app.close()

    # Rotate: set a new password and redeploy; the old one stops working.
    run("app.db_roles", DATABASE_URL=owner_url, APP_DB_PASSWORD="rotated-password")
    with pytest.raises(asyncpg.InvalidPasswordError):
        await asyncpg.connect(url_for(TEST_DB, "app_rw_login", PASSWORD))
    app = await asyncpg.connect(url_for(TEST_DB, "app_rw_login", "rotated-password"))
    await app.close()


def test_skips_login_role_without_password(owner_url):
    result = run("app.db_roles", DATABASE_URL=owner_url)
    assert "skipping login role" in result.stdout + result.stderr
