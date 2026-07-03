from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.dependencies import current_user
from app.models import User
from app.schemas.auth import LoginIn, LoginOut, UserOut
from app.security.csrf import validate_csrf
from app.security.rate_limit import check_rest_rate
from app.security.sessions import COOKIE_NAME, create_session
from app.security.tokens import csrf_token
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginOut)
def login(request: Request, payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    check_rest_rate(request, "login", 5, 60)
    user = AuthService(db).authenticate(payload.username, payload.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Ungueltige Zugangsdaten")
    settings = get_settings()
    csrf = csrf_token()
    response.set_cookie(COOKIE_NAME, create_session(user.id), httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite, max_age=settings.session_max_age)
    response.set_cookie(settings.csrf_cookie_name, csrf, httponly=False, secure=settings.cookie_secure, samesite=settings.cookie_samesite, max_age=settings.session_max_age)
    return {"id": user.id, "username": user.username, "role": user.role.value, "csrf_token": csrf}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user

@router.post("/logout", dependencies=[Depends(validate_csrf)])
def logout(response: Response):
    settings = get_settings()
    response.delete_cookie(COOKIE_NAME)
    response.delete_cookie(settings.csrf_cookie_name)
    return {"ok": True}