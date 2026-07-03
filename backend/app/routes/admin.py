from datetime import date
from fastapi import APIRouter, Depends
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import current_user
from app.models import User
from app.schemas.admin import StatsOut
from app.security.permissions import require_admin
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats", response_model=StatsOut)
def stats(from_date: date | None = None, to_date: date | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_admin(user)
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Startdatum darf nicht nach dem Enddatum liegen")
    return StatsService(db).stats(from_date, to_date)
