from datetime import datetime
from decimal import Decimal
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MAX_PRICE = Decimal("999999.99")


def _normalize_name(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Name darf nicht leer sein")
    return value


def _normalize_description(value: str | None) -> str:
    if value is None:
        return ""
    value = value.strip()
    if len(value) > 2000:
        raise ValueError("Beschreibung darf maximal 2000 Zeichen lang sein")
    return value


def _validate_price(value: Decimal) -> Decimal:
    if not value.is_finite():
        raise ValueError("Preis muss eine gueltige Dezimalzahl sein")
    if value < 0:
        raise ValueError("Preis darf nicht negativ sein")
    if value > MAX_PRICE:
        raise ValueError("Preis ist zu hoch")
    if value.as_tuple().exponent < -2:
        raise ValueError("Preis darf maximal zwei Nachkommastellen haben")
    return value


def _normalize_image_url(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if len(value) > 500:
        raise ValueError("Bild-URL darf maximal 500 Zeichen lang sein")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Bild-URL muss mit http oder https beginnen")
    return value


class PublicProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: Decimal
    image_url: str | None = None
    model_config = ConfigDict(from_attributes=True)


class StaffProductOut(PublicProductOut):
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ProductCreate(BaseModel):
    name: str = Field(max_length=120)
    description: str | None = Field(default="", max_length=2000)
    price: Decimal
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    sort_order: int = Field(default=0, ge=-10000, le=10000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _normalize_name(value)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str:
        return _normalize_description(value)

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        return _validate_price(value)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        return _normalize_image_url(value)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal | None = None
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = Field(default=None, ge=-10000, le=10000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return _normalize_name(value) if value is not None else value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str:
        return _normalize_description(value)

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal | None) -> Decimal | None:
        return _validate_price(value) if value is not None else value

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        return _normalize_image_url(value)

    @model_validator(mode="after")
    def reject_empty_or_null_update(self):
        if not self.model_fields_set:
            raise ValueError("Mindestens ein Feld muss geaendert werden")
        for field_name in ("name", "price", "is_active", "sort_order"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} darf nicht null sein")
        return self


class ProductListOut(BaseModel):
    items: list[StaffProductOut]
    page: int
    page_size: int
    total: int


ProductOut = PublicProductOut
