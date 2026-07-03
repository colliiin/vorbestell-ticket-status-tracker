from fastapi import Header, HTTPException, Request, status
from app.config import get_settings

CSRF_HEADER = "X-CSRF-Token"

def validate_csrf(request: Request, x_csrf_token: str | None = Header(default=None)) -> None:
    settings = get_settings()
    cookie_value = request.cookies.get(settings.csrf_cookie_name)
    if not cookie_value or not x_csrf_token or cookie_value != x_csrf_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF-Token fehlt oder ist ungueltig")