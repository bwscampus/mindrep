"""Alembic environment.

Runs migrations through the SAME async driver the app uses. The obvious
alternative — stripping "+asyncpg" and letting Alembic open a sync connection
— needs psycopg2 installed alongside asyncpg purely for migrations. One
driver is simpler to install, pin, and reason about.
"""

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import async_driver_url, settings
from app.db import Base

# Importing the models registers them on Base.metadata for autogenerate.
from app.auth import models as auth_models  # noqa: F401

try:
    from app import models as project_models  # noqa: F401
except ImportError:
    # Projects that add no tables of their own.
    pass

# Migrations run as the database owner. In production the app itself connects
# as the restricted app_rw_login role (DATABASE_URL), which cannot run DDL,
# so the owner's URL comes in separately as MIGRATION_DATABASE_URL. Locally
# and in tests there is one URL, and it is used for both.
MIGRATION_URL = async_driver_url(
    os.environ.get("MIGRATION_DATABASE_URL") or settings.DATABASE_URL
)

config = context.config
# configparser treats % as interpolation; a password containing % would break.
config.set_main_option("sqlalchemy.url", MIGRATION_URL.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Emit SQL to stdout without connecting (alembic upgrade --sql)."""
    context.configure(
        url=MIGRATION_URL.replace("+asyncpg", ""),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, target_metadata=target_metadata, compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_async_migrations())
