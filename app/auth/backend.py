"""Authentication backend: httpOnly cookie + database-backed sessions.

Why not a JWT bearer token: a JWT has to live somewhere JavaScript can read
it, so any XSS exfiltrates a portable credential, and nothing can revoke it
before it expires. An opaque cookie is unreadable to JS, and a session row can
be deleted the instant a user logs out or resets their password.

The tradeoff is CSRF, since browsers attach cookies automatically. SameSite=Lax
blocks the cross-site form-POST case; add a CSRF token if you ever need
SameSite=None.
"""

import base64
import hashlib
from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi_users import models
from fastapi_users.authentication import AuthenticationBackend, CookieTransport
from fastapi_users.authentication.strategy.db import (
    AccessTokenDatabase,
    DatabaseStrategy,
)
from fastapi_users_db_sqlalchemy.access_token import (
    SQLAlchemyAccessTokenDatabase,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AccessToken
from app.config import settings
from app.db import get_async_session

cookie_transport = CookieTransport(
    cookie_name=settings.SESSION_COOKIE_NAME,
    cookie_max_age=settings.SESSION_LIFETIME_SECONDS,
    cookie_httponly=True,
    cookie_secure=settings.cookie_secure,  # False on localhost, True in prod
    cookie_samesite="lax",
)


async def get_access_token_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyAccessTokenDatabase[AccessToken], None]:
    yield SQLAlchemyAccessTokenDatabase(session, AccessToken)


def hash_token(raw: str) -> str:
    """The value stored in access_tokens.token for a session token.

    base64url(sha256) without padding is 43 characters, the same width as the
    raw token, so the column needs no schema change. Migration
    0003_hash_access_tokens computes the identical value in SQL.
    """
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


class HashedDatabaseStrategy(DatabaseStrategy):
    """Database sessions where the table holds only a hash of each token.

    The client keeps the raw token (in the cookie); the database keeps
    sha256 of it. Anyone who can read the database (a backup, a leaked
    credential) sees nothing they can present as a session. The token is
    high-entropy random, so an unsalted fast hash is enough: there is
    nothing to brute-force.
    """

    async def read_token(self, token, user_manager):
        if token is None:
            return None
        return await super().read_token(hash_token(token), user_manager)

    async def write_token(self, user: models.UP) -> str:
        token_dict = self._create_access_token_dict(user)
        raw = token_dict["token"]
        await self.database.create({**token_dict, "token": hash_token(raw)})
        return raw

    async def destroy_token(self, token: str, user: models.UP) -> None:
        await super().destroy_token(hash_token(token), user)


def get_database_strategy(
    access_token_db: AccessTokenDatabase[AccessToken] = Depends(
        get_access_token_db
    ),
) -> DatabaseStrategy:
    return HashedDatabaseStrategy(
        access_token_db, lifetime_seconds=settings.SESSION_LIFETIME_SECONDS
    )


auth_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,
    get_strategy=get_database_strategy,
)
