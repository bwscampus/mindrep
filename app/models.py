"""MindRep's own tables.

Progress is stored as two JSON documents rather than a wide relational
schema. The client already treats `progress` as one object — it is appended
to, reshaped, and saved wholesale — so storing it as a document keeps the
server out of the way as the app's shape evolves. No migration is needed to
add a field to a lesson's activity result.

The tradeoff is that Postgres can't enforce anything about the contents, and
two devices writing at once is last-write-wins. Both are acceptable for a
single-athlete progress blob; neither would be for, say, payments.
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

# JSONB on Postgres, plain JSON on SQLite so the test suite needs no database.
JSONDocument = JSON().with_variant(postgresql.JSONB, "postgresql")


class UserState(Base):
    """One row per athlete: their profile and their progress."""

    __tablename__ = "user_state"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="cascade"), primary_key=True
    )
    profile: Mapped[dict | None] = mapped_column(
        JSONDocument, nullable=True, default=None
    )
    progress: Mapped[dict] = mapped_column(
        JSONDocument, nullable=False, default=dict
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
