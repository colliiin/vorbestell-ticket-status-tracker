import pytest
from pydantic import ValidationError
from app.schemas.order import OrderIn
from app.schemas.product import ProductCreate, ProductUpdate

def test_order_requires_name():
    with pytest.raises(ValidationError):
        OrderIn(customer_name="", items=[{"product_id": 1, "quantity": 1}])


def test_product_create_normalizes_empty_image_url():
    product = ProductCreate(name=" Kaffee ", description=None, price="8.40", image_url=" ")
    assert product.name == "Kaffee"
    assert product.description == ""
    assert product.image_url is None


def test_product_update_rejects_empty_payload():
    with pytest.raises(ValidationError):
        ProductUpdate()


def test_product_update_rejects_null_price():
    with pytest.raises(ValidationError):
        ProductUpdate(price=None)
