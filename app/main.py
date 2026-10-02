"""Application factory.

Order matters in two places and both are easy to get wrong:

1. Middleware. Starlette wraps each `add_middleware` call around the previous
   one, so the LAST registered runs FIRST. Registration below is therefore
   written inside-out.
2. Routes vs. static files. The catch-all StaticFiles mount at "/" must be
   added after every API router, or it swallows them and every /api call
   returns 404.
"""

import logging
import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.router import install_auth_routes
from app.config import Settings, settings
from app.logging import (
    RequestContextMiddleware,
    configure_logging,
    install_exception_handlers,
)
from app.rate_limit import RateLimitMiddleware
from app.routers import health, state
from app.security import install_security_middleware

logger = logging.getLogger("app")

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

# StaticFiles guesses types from the OS's mime table, which differs by machine:
# macOS maps .m4a to audio/mp4a-latm, which Safari can refuse to play. Pin the
# lesson media types so local and Railway serve the same headers.
for _type, _ext in [
    ("audio/mpeg", ".mp3"),
    ("audio/mp4", ".m4a"),
    ("video/mp4", ".mp4"),
    ("video/webm", ".webm"),
    ("text/vtt", ".vtt"),
]:
    mimetypes.add_type(_type, _ext)


def create_app(config: Settings | None = None) -> FastAPI:
    config = config or settings
    configure_logging()

    app = FastAPI(
        title=config.APP_NAME,
        version=config.VERSION,
        # An attacker reading your schema is a gift. Keep docs to non-prod.
        docs_url=None if config.is_production else "/docs",
        redoc_url=None if config.is_production else "/redoc",
        openapi_url=None if config.is_production else "/openapi.json",
    )

    install_exception_handlers(app)

    # Registered inside-out: RequestContext ends up outermost so every log
    # line, including the security layer's, carries a request id.
    install_security_middleware(app, config)
    app.add_middleware(RateLimitMiddleware, settings=config)
    app.add_middleware(RequestContextMiddleware)

    app.include_router(health.router, prefix="/api", tags=["health"])
    install_auth_routes(app, prefix="/api")

    register_project_routes(app)

    # Must stay last. html=True serves index.html at "/".
    if PUBLIC_DIR.is_dir():
        app.mount(
            "/", StaticFiles(directory=PUBLIC_DIR, html=True), name="static"
        )
    else:
        logger.warning("No public/ directory at %s — serving API only", PUBLIC_DIR)

    return app


def register_project_routes(app: FastAPI) -> None:
    """MindRep's own routes."""
    app.include_router(state.router, prefix="/api", tags=["state"])


app = create_app()
