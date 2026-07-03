from fastapi import HTTPException, status
from app.models import User, UserRole

def require_admin(user: User) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Adminrechte erforderlich")
    return user


def require_owner_or_admin(user: User) -> User:
    if user.role not in (UserRole.owner, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner- oder Adminrechte erforderlich")
    return user
