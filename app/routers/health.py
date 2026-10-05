"""Health endpoint. Railway's healthcheckPath points here.

It runs a trivial query so "healthy" means the app can actually reach
Postgres, and says nothing about the environment or version — an attacker
gains from that, an uptime monitor doesn't (Production Standard API-9).
"""

import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_async_session

router = APIRouter()
logger = logging.getLogger("app.health")


@router.get("/health")
async def health(session: AsyncSession = Depends(get_async_session)):
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check could not reach the database")
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}
