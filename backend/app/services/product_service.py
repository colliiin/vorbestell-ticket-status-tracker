from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def list_public(self) -> list[Product]:
        return self.db.scalars(
            select(Product)
            .where(Product.is_active == True)
            .order_by(Product.sort_order.asc(), Product.name.asc())
        ).all()

    def list_staff(
        self,
        search: str | None,
        active: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Product], int, int, int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        stmt = select(Product)
        count_stmt = select(func.count(Product.id))
        conditions = []
        if search and search.strip():
            conditions.append(Product.name.ilike(f"%{search.strip()}%"))
        if active is not None:
            conditions.append(Product.is_active == active)
        for condition in conditions:
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)
        stmt = stmt.order_by(Product.sort_order.asc(), Product.name.asc()).offset((page - 1) * page_size).limit(page_size)
        return self.db.scalars(stmt).all(), self.db.scalar(count_stmt) or 0, page, page_size

    def get(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def create(self, payload: ProductCreate) -> Product:
        product = Product(**payload.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, payload: ProductUpdate) -> Product:
        for field_name, value in payload.model_dump(exclude_unset=True).items():
            setattr(product, field_name, value)
        self.db.commit()
        self.db.refresh(product)
        return product
