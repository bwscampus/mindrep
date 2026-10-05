"""Create and maintain the restricted role the app connects as (rule DB-6).

Run after migrations, as the database owner, on every deploy:

    alembic upgrade head && python -m app.db_roles && exec uvicorn ...

It is idempotent. It ensures:

- `app_rw`: a NOLOGIN group role with read/write on the app's tables and
  sequences and nothing else. No DDL, no superuser, no BYPASSRLS. Default
  privileges extend those grants to tables future migrations create.
- `app_rw_login`: the LOGIN role the app uses, a member of app_rw. It is only
  created when APP_DB_PASSWORD is set, and its password is (re)set on every
  run, so rotating means changing the variable and redeploying.

Why bother: the app used to connect as the `postgres` superuser. A SQL
injection or a stolen app credential could then drop tables, read other
databases, create roles, or bypass row-level security. As app_rw_login, the
worst case shrinks to the rows the app can already see.

Connects with MIGRATION_DATABASE_URL (the owner) or, locally, DATABASE_URL.
Does nothing on SQLite.
"""

import asyncio
import logging
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import async_driver_url, settings

logger = logging.getLogger("app.db_roles")

GROUP_ROLE = "app_rw"
LOGIN_ROLE = "app_rw_login"

GROUP_STATEMENTS = [
    f"""
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{GROUP_ROLE}') THEN
        CREATE ROLE {GROUP_ROLE} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
          NOREPLICATION NOBYPASSRLS;
      END IF;
    END $$
    """,
    f"""
    DO $$ BEGIN
      EXECUTE format('GRANT CONNECT ON DATABASE %I TO {GROUP_ROLE}',
                     current_database());
    END $$
    """,
    # Postgres < 15 lets every role create tables in `public`; take that away
    # so the app role really has no DDL. (A no-op on 15+.)
    "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
    f"GRANT USAGE ON SCHEMA public TO {GROUP_ROLE}",
    f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public "
    f"TO {GROUP_ROLE}",
    f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {GROUP_ROLE}",
    # Tables and sequences that later migrations (run by this same owner)
    # create get the same grants automatically.
    f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
    f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {GROUP_ROLE}",
    f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
    f"GRANT USAGE, SELECT ON SEQUENCES TO {GROUP_ROLE}",
    # The app has no business editing migration history.
    f"""
    DO $$ BEGIN
      IF to_regclass('public.alembic_version') IS NOT NULL THEN
        EXECUTE 'REVOKE ALL ON public.alembic_version FROM {GROUP_ROLE}';
      END IF;
    END $$
    """,
]

LOGIN_STATEMENTS = [
    f"""
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{LOGIN_ROLE}') THEN
        CREATE ROLE {LOGIN_ROLE} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
          NOREPLICATION NOBYPASSRLS;
      END IF;
    END $$
    """,
    f"GRANT {GROUP_ROLE} TO {LOGIN_ROLE}",
]


def owner_url() -> str:
    return async_driver_url(
        os.environ.get("MIGRATION_DATABASE_URL") or settings.DATABASE_URL
    )


async def ensure_app_role(url: str, password: str | None) -> bool:
    """Apply the grants; returns False (and does nothing) off Postgres."""
    if not url.startswith("postgresql"):
        logger.info("Not a Postgres URL; skipping app role setup")
        return False

    # hide_parameters: if a statement fails, SQLAlchemy's error message would
    # otherwise include the bound password.
    engine = create_async_engine(url, hide_parameters=True)
    try:
        async with engine.begin() as conn:
            for statement in GROUP_STATEMENTS:
                await conn.execute(text(statement))
            if not password:
                logger.info(
                    "APP_DB_PASSWORD not set; skipping login role %s", LOGIN_ROLE
                )
                return True
            for statement in LOGIN_STATEMENTS:
                await conn.execute(text(statement))
            # CREATE/ALTER ROLE can't take bind parameters, so let Postgres
            # quote the password with format(%L) and run the result. The
            # password never passes through Python string formatting or logs.
            # exec_driver_sql, not text(): text() would read ":word" inside
            # the quoted password as a bind parameter.
            alter = await conn.scalar(
                text(
                    f"SELECT format('ALTER ROLE {LOGIN_ROLE} PASSWORD %L',"
                    " CAST(:pw AS text))"
                ),
                {"pw": password},
            )
            await conn.exec_driver_sql(alter)
            logger.info("Login role %s is ready", LOGIN_ROLE)
        return True
    finally:
        await engine.dispose()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    asyncio.run(ensure_app_role(owner_url(), os.environ.get("APP_DB_PASSWORD")))


if __name__ == "__main__":
    main()
