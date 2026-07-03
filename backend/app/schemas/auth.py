from pydantic import BaseModel
from app.models.user import UserRole

class LoginIn(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: UserRole

class LoginOut(UserOut):
    csrf_token: str