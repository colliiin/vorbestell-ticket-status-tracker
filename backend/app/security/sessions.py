from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from app.config import get_settings

COOKIE_NAME = "staff_session"

def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().session_secret, salt="staff-session")

def create_session(user_id: int) -> str:
    return _serializer().dumps({"uid": user_id})

def read_session(value: str | None) -> int | None:
    if not value:
        return None
    try:
        data = _serializer().loads(value, max_age=get_settings().session_max_age)
    except (BadSignature, SignatureExpired):
        return None
    uid = data.get("uid")
    return int(uid) if uid else None