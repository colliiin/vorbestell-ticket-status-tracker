from decimal import Decimal
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Product

DEMO_PRODUCTS = [
    {"name": "Frisches Brot", "description": "Knusprig gebacken.", "price": Decimal("3.50"), "sort_order": 1},
    {"name": "Obstkiste", "description": "Saisonale Auswahl.", "price": Decimal("12.90"), "sort_order": 2},
    {"name": "Kaffee Paket", "description": "Hausmischung als Bohne.", "price": Decimal("8.40"), "sort_order": 3},
]

def main():
    db = SessionLocal()
    try:
        created = 0
        for item in DEMO_PRODUCTS:
            if db.scalar(select(Product).where(Product.name == item["name"])):
                continue
            db.add(Product(**item, is_active=True))
            created += 1
        db.commit()
        print(f"Demo products created: {created}")
    finally:
        db.close()

if __name__ == "__main__":
    main()