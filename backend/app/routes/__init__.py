from . import admin, auth, health, orders, products, public_tickets, staff_products, staff_tickets, websocket

routers = [
    health.router,
    products.router,
    orders.router,
    public_tickets.router,
    auth.router,
    staff_products.router,
    staff_tickets.router,
    admin.router,
    websocket.router,
]
