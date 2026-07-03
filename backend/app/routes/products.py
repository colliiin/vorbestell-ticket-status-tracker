from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.product import PublicProductOut
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=list[PublicProductOut])
def list_products(db: Session = Depends(get_db)):
    return ProductService(db).list_public()
