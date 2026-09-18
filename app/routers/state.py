"""Athlete profile + progress.

One document in, one document out. The client keeps an in-memory copy and
writes the whole thing back on a debounce, so these are the only two routes
the app needs to be fully synced.
"""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.router import current_active_user
from app.db import get_async_session
from app.models import UserState

router = APIRouter()


class StatePayload(BaseModel):
    profile: dict[str, Any] | None = None
    progress: dict[str, Any] = Field(default_factory=dict)


class StateResponse(StatePayload):
    email: str


async def _load(session: AsyncSession, user: User) -> UserState | None:
    result = await session.execute(
        select(UserState).where(UserState.user_id == user.id)
    )
    return result.scalar_one_or_none()


@router.get("/state", response_model=StateResponse)
async def read_state(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> StateResponse:
    state = await _load(session, user)
    if state is None:
        # A brand-new account: empty state, not a 404. The client treats
        # "no profile" as "run onboarding".
        return StateResponse(email=user.email, profile=None, progress={})
    return StateResponse(
        email=user.email, profile=state.profile, progress=state.progress
    )


@router.put("/state", response_model=StateResponse)
async def write_state(
    payload: StatePayload,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> StateResponse:
    state = await _load(session, user)
    if state is None:
        state = UserState(user_id=user.id)
        session.add(state)

    state.profile = payload.profile
    state.progress = payload.progress
    await session.commit()
    await session.refresh(state)

    return StateResponse(
        email=user.email, profile=state.profile, progress=state.progress
    )
