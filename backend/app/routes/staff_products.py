from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import current_user
from app.models import User
from app.schemas.product import ProductCreate, ProductListOut, ProductUpdate, StaffProductOut
from app.security.csrf import validate_csrf
from app.security.permissions import require_owner_or_admin
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/staff/products", tags=["staff-products"])


@router.get("", response_model=ProductListOut)
def list_products(
    search: str | None = None,
    active: bool | None = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    require_owner_or_admin(user)
    items, total, page, page_size = ProductService(db).list_staff(search, active, page, page_size)
    return {"items": items, "page": page, "page_size": page_size, "total": total}


@router.get("/{product_id}", response_model=StaffProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_owner_or_admin(user)
    product = ProductService(db).get(product_id)
    if not product:
        raise HTTPException(404, "Produkt wurde nicht gefunden")
    return product


@router.post("", response_model=StaffProductOut, dependencies=[Depends(validate_csrf)])
def create_product(payload: ProductCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_owner_or_admin(user)
    return ProductService(db).create(payload)


@router.patch("/{product_id}", response_model=StaffProductOut, dependencies=[Depends(validate_csrf)])
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_owner_or_admin(user)
    service = ProductService(db)
    product = service.get(product_id)
    if not product:
        raise HTTPException(404, "Produkt wurde nicht gefunden")
    return service.update(product, payload)
