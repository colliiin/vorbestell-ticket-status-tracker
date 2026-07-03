from pydantic import BaseModel, Field

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)

class OrderIn(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    items: list[OrderItemIn] = Field(min_length=1)

class OrderCreated(BaseModel):
    ticket_token: str
    redirect_url: str