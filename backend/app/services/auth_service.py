from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import User
from app.security.passwords import verify_password

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate(self, username: str, password: str) -> User | None:
        user = self.db.scalar(select(User).where(User.username == username, User.is_active == True))
        if not user or not verify_password(password, user.password_hash):
            return None
        user.last_login_at = datetime.utcnow()
        self.db.commit()
        return user