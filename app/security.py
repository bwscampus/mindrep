"""Security middleware: response headers, CORS, origin checks, trusted hosts."""

from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import Settings

HSTS = "max-age=31536000; includeSubDomains"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Headers that cost nothing and close off whole bug classes.

    CSP is the one that needs per-project tuning — see Settings.
    """

    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings
        self._csp = settings.content_security_policy()

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)
        headers = response.headers
        headers.setdefault("Content-Security-Policy", self._csp)
        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault(
            "Referrer-Policy", "strict-origin-when-cross-origin"
        )
        headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=()",
        )
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        if self._settings.is_production:
            headers.setdefault("Strict-Transport-Security", HSTS)
        return response


UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
# Content types a cross-site <form> (or no-preflight fetch) can send. Anything
# else, e.g. application/json, needs a CORS preflight, which CORSMiddleware
# refuses for unknown origins.
SIMPLE_CONTENT_TYPES = (
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
)


def _origin_of(url: str) -> str | None:
    parts = urlsplit(url)
    if not parts.scheme or not parts.netloc:
        return None
    return f"{parts.scheme}://{parts.netloc}".lower()


class OriginCheckMiddleware(BaseHTTPMiddleware):
    """Reject cross-site state-changing requests to the API (rule API-6).

    Sessions are cookies with SameSite=Lax, which stops most CSRF but not
    login CSRF: /api/auth/login takes a form-encoded POST, so another site
    could sign a victim into the attacker's account. Browsers send `Origin`
    on every POST (and `Referer` almost always), so for unsafe methods under
    /api/ we require one of them to name this site. A request with neither is
    only allowed when its body type can't be produced by a cross-site form
    (e.g. application/json), since those need a CORS preflight.
    """

    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        trusted = [settings.PUBLIC_BASE_URL, *settings.ALLOWED_ORIGINS]
        self._trusted = {o for o in (_origin_of(u) for u in trusted) if o}

    def _allowed(self, origin: str | None, request: Request) -> bool:
        if origin is None:
            return False
        # The site's own origin as the request arrived (uvicorn's
        # --proxy-headers makes the scheme https behind Railway). Covers local
        # dev and tests, where PUBLIC_BASE_URL may name a different port.
        own = _origin_of(f"{request.url.scheme}://{request.headers.get('host', '')}")
        return origin in self._trusted or origin == own

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.method in UNSAFE_METHODS and request.url.path.startswith("/api/"):
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            if origin is not None and origin != "null":
                ok = self._allowed(_origin_of(origin), request)
            elif referer:
                ok = self._allowed(_origin_of(referer), request)
            else:
                content_type = request.headers.get("content-type", "").lower()
                ok = bool(content_type) and not content_type.startswith(
                    SIMPLE_CONTENT_TYPES
                )
            if not ok:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Cross-site request blocked."},
                )
        return await call_next(request)


def install_security_middleware(app: FastAPI, settings: Settings) -> None:
    """Attach security middleware.

    Starlette runs middleware in reverse order of registration, so the calls
    below execute outermost-last: TrustedHost sees the request first, then
    CORS (which answers preflights), then the origin check, with the header
    layer wrapping the response on the way back out (including a 403 from the
    origin check).
    """
    app.add_middleware(OriginCheckMiddleware, settings=settings)
    app.add_middleware(SecurityHeadersMiddleware, settings=settings)

    if settings.ALLOWED_ORIGINS:
        # Credentials + an explicit allowlist. Never "*" with credentials —
        # browsers reject it, and it would be wrong if they didn't.
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.ALLOWED_ORIGINS,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type"],
            max_age=600,
        )

    if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS != ["*"]:
        app.add_middleware(
            TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS
        )
