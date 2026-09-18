"""Auth tables.

`users` and `access_tokens` come from fastapi-users' SQLAlchemy adapter. A
project's own tables live elsewhere (see references/schema.md) so template
migrations and project migrations never fight over the same revisions.
"""

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from fastapi_users_db_sqlalchemy.access_token import (
    SQLAlchemyBaseAccessTokenTableUUID,
)
from fastapi_users_db_sqlalchemy.generics import GUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.db import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    """id, email, hashed_password, is_active, is_superuser, is_verified.

    Add project columns here, then generate a migration.
    """

    __tablename__ = "users"


class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, Base):
    """Server-side sessions.

    A row per logged-in device. Deleting rows logs that device out
    immediately — the whole reason we don't use stateless JWTs.
    """

    __tablename__ = "access_tokens"

    @declared_attr
    def user_id(cls) -> Mapped[GUID]:
        # The base class points at "user.id"; we use the plural table name,
        # so the foreign key has to be redeclared here.
        return mapped_column(
            GUID, ForeignKey("users.id", ondelete="cascade"), nullable=False
        )
