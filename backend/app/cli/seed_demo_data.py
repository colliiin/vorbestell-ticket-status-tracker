from decimal import Decimal
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Product

DEMO_PRODUCTS = [
    {
        "name": "BudsZ38 – Full Spectrum Öl 20% (10 ml)",
        "description": "Full-Spectrum-Hanföl mit CBD, CBC, CBG und CBDV aus zertifiziertem organischem Hanf. THC-Gehalt unter 0,2%.",
        "price": Decimal("59.95"),
        "image_url": "https://smoke420.store/cdn/shop/files/IMG-5874_1000x.png?v=1766054654",
        "sort_order": 1,
    },
    {
        "name": "BudsZ38 – Full Spectrum Öl 30% (10 ml)",
        "description": "Full-Spectrum-Hanföl mit CBD, CBC, CBG und CBDV aus zertifiziertem organischem Hanf. THC-Gehalt unter 0,2%.",
        "price": Decimal("79.50"),
        "image_url": "https://smoke420.store/cdn/shop/files/IMG-5876_1000x.png?v=1766054258",
        "sort_order": 2,
    },
    {
        "name": "Lemon Haze – Happy Hemp H3 Ultra Vape (98% CBD, 1000 mg / 1 ml / ca. 500 Züge)",
        "description": "Einfach zu verwendendes CBD-Vape mit frischem, leicht fruchtigem Lemon-Haze-Aroma.",
        "price": Decimal("30.00"),
        "image_url": "https://smoke420.store/cdn/shop/files/WhatsApp_Bild_2025-12-15_um_16.54.00_10281518_1000x.jpg?v=1766062160",
        "sort_order": 3,
    },
    {
        "name": "Juicy Melon – Happy Hemp H3 Ultra Vape (98% CBD, 1000 mg / 1 ml / ca. 500 Züge)",
        "description": "Einfach zu verwendendes CBD-Vape mit sanftem, fruchtigem Juicy-Melon-Aroma.",
        "price": Decimal("30.00"),
        "image_url": "https://smoke420.store/cdn/shop/files/WhatsApp_Bild_2025-12-15_um_16.53.59_120f25dc_1000x.jpg?v=1766061067",
        "sort_order": 4,
    },
    {
        "name": "Cherry Blaze – H4 Puffs Premium Disposable Vape (1000 mg / 1 ml / ca. 500 Züge)",
        "description": "Premium Disposable Vape mit Hanfextrakt, H4 Superior Blend, CBD und natürlichen Terpenen.",
        "price": Decimal("30.00"),
        "image_url": "https://smoke420.store/cdn/shop/files/IMG-5856_1000x.png?v=1766058404",
        "sort_order": 5,
    },
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
