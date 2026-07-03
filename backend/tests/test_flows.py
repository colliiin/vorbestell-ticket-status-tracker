import os
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["SESSION_SECRET"] = "test-secret-test-secret-test-secret"
os.environ["ALLOWED_ORIGINS"] = "http://testserver"

from datetime import datetime
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import ChatMessage, Product, SenderType, StatusHistory, Ticket, TicketItem, TicketStatus, User, UserRole
from app.security.passwords import hash_password

engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@pytest.fixture(autouse=True)
def db():
    from app.security.rate_limit import limiter
    limiter._hits.clear()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = TestingSession()
    session.add_all([
        Product(id=1, name="Active", description="A", price=1, is_active=True, sort_order=1),
        Product(id=2, name="Inactive", description="I", price=1, is_active=False, sort_order=2),
        User(username="admin", password_hash=hash_password("password123"), role=UserRole.admin),
        User(username="owner", password_hash=hash_password("password123"), role=UserRole.owner),
    ])
    session.commit()
    session.close()
    def override_db():
        test_db = TestingSession()
        try:
            yield test_db
        finally:
            test_db.close()
    app.dependency_overrides[get_db] = override_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app, base_url="http://testserver")

def login(client, username="admin", password="password123"):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["csrf_token"]


def test_public_product_list_only_contains_active_products(client):
    response = client.get("/api/products")
    assert response.status_code == 200
    names = [item["name"] for item in response.json()]
    assert names == ["Active"]


def test_public_product_list_is_sorted_by_sort_order_and_name(client):
    session = TestingSession()
    try:
        session.add_all([
            Product(name="Beta", description="", price=2, is_active=True, sort_order=0),
            Product(name="Alpha", description="", price=2, is_active=True, sort_order=0),
            Product(name="Zulu", description="", price=2, is_active=True, sort_order=-1),
        ])
        session.commit()
    finally:
        session.close()
    names = [item["name"] for item in client.get("/api/products").json()]
    assert names == ["Zulu", "Alpha", "Beta", "Active"]


def test_staff_product_list_requires_login(client):
    response = client.get("/api/staff/products")
    assert response.status_code == 401


def test_staff_product_create_and_update_require_login(client):
    create = client.post("/api/staff/products", json={"name": "Nope", "price": "1.00"})
    update = client.patch("/api/staff/products/1", json={"name": "Nope"})
    assert create.status_code in {401, 403}
    assert update.status_code in {401, 403}


def test_owner_can_open_staff_product_list(client):
    login(client, "owner")
    response = client.get("/api/staff/products")
    assert response.status_code == 200
    assert response.json()["total"] == 2


def test_admin_can_open_staff_product_list(client):
    login(client, "admin")
    response = client.get("/api/staff/products")
    assert response.status_code == 200
    assert response.json()["total"] == 2


def test_staff_product_can_be_created_with_valid_data(client):
    csrf = login(client, "owner")
    response = client.post(
        "/api/staff/products",
        json={
            "name": "Kaffee Paket",
            "description": "Hausmischung als ganze Bohne.",
            "price": "8.40",
            "image_url": "https://example.test/kaffee.jpg",
            "is_active": True,
            "sort_order": 10,
        },
        headers={"X-CSRF-Token": csrf},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Kaffee Paket"
    assert data["is_active"] is True
    assert data["sort_order"] == 10


def test_staff_product_name_must_not_be_empty(client):
    csrf = login(client)
    response = client.post("/api/staff/products", json={"name": "   ", "price": "1.00"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 422


def test_staff_product_rejects_negative_price(client):
    csrf = login(client)
    response = client.post("/api/staff/products", json={"name": "Preisfehler", "price": "-0.01"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 422


def test_staff_product_rejects_price_with_more_than_two_decimals(client):
    csrf = login(client)
    response = client.post("/api/staff/products", json={"name": "Preisfehler", "price": "1.234"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 422


def test_staff_product_rejects_invalid_image_url(client):
    csrf = login(client)
    response = client.post("/api/staff/products", json={"name": "Bildfehler", "price": "1.00", "image_url": "ftp://example.test/bild.jpg"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 422


def test_staff_product_can_be_updated(client):
    csrf = login(client)
    response = client.patch("/api/staff/products/1", json={"name": "Updated", "price": "2.50", "sort_order": -5}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated"
    assert Decimal(data["price"]) == Decimal("2.50")
    assert data["sort_order"] == -5


def test_staff_product_can_be_deactivated_and_disappears_publicly(client):
    csrf = login(client)
    response = client.patch("/api/staff/products/1", json={"is_active": False}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    public_names = [item["name"] for item in client.get("/api/products").json()]
    assert "Active" not in public_names


def test_deactivated_product_cannot_be_ordered_after_staff_change(client):
    csrf = login(client)
    assert client.patch("/api/staff/products/1", json={"is_active": False}, headers={"X-CSRF-Token": csrf}).status_code == 200
    response = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]})
    assert response.status_code == 400


def test_staff_product_can_be_reactivated(client):
    csrf = login(client)
    response = client.patch("/api/staff/products/2", json={"is_active": True}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    assert response.json()["is_active"] is True
    public_names = [item["name"] for item in client.get("/api/products").json()]
    assert "Inactive" in public_names


def test_staff_product_search_filter_and_pagination(client):
    session = TestingSession()
    try:
        session.add_all([
            Product(name="Kaffee", description="", price=3, is_active=True, sort_order=3),
            Product(name="Tee", description="", price=2, is_active=True, sort_order=4),
            Product(name="Kakao", description="", price=2, is_active=False, sort_order=5),
        ])
        session.commit()
    finally:
        session.close()
    login(client)
    search = client.get("/api/staff/products?search=kaffee").json()
    inactive = client.get("/api/staff/products?active=false").json()
    page = client.get("/api/staff/products?page=2&page_size=2").json()
    assert [item["name"] for item in search["items"]] == ["Kaffee"]
    assert {item["name"] for item in inactive["items"]} == {"Inactive", "Kakao"}
    assert page["page"] == 2
    assert page["page_size"] == 2
    assert page["total"] == 5
    assert len(page["items"]) == 2


def test_staff_product_changes_require_csrf(client):
    login(client)
    create = client.post("/api/staff/products", json={"name": "Ohne Token", "price": "1.00"})
    update = client.patch("/api/staff/products/1", json={"price": "1.50"})
    assert create.status_code == 403
    assert update.status_code == 403


def test_ticket_item_snapshots_survive_product_changes(client):
    token = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]}).json()["ticket_token"]
    csrf = login(client)
    response = client.patch("/api/staff/products/1", json={"name": "Neuer Name", "price": "9.99", "is_active": False}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    ticket = client.get(f"/api/public/tickets/{token}").json()
    item = ticket["items"][0]
    assert item["product_name_snapshot"] == "Active"
    assert Decimal(item["unit_price_snapshot"]) == Decimal("1.00")

def test_order_validation(client):
    assert client.post("/api/orders", json={"customer_name": "", "items": [{"product_id": 1, "quantity": 1}]}).status_code == 422
    assert client.post("/api/orders", json={"customer_name": "Max", "items": []}).status_code == 422
    assert client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 0}]}).status_code == 422

def test_inactive_product_cannot_be_ordered(client):
    response = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 2, "quantity": 1}]})
    assert response.status_code == 400

def test_successful_order_and_idempotency(client):
    body = {"customer_name": "Max", "items": [{"product_id": 1, "quantity": 2}]}
    first = client.post("/api/orders", json=body, headers={"Idempotency-Key": "same"})
    second = client.post("/api/orders", json=body, headers={"Idempotency-Key": "same"})
    assert first.status_code == 200
    assert first.json()["ticket_token"] == second.json()["ticket_token"]
    session = TestingSession()
    try:
        assert session.query(Ticket).count() == 1
        assert session.query(Ticket).first().items[0].quantity == 2
    finally:
        session.close()

def test_idempotency_conflict(client):
    ok = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]}, headers={"Idempotency-Key": "conflict"})
    bad = client.post("/api/orders", json={"customer_name": "Anna", "items": [{"product_id": 1, "quantity": 1}]}, headers={"Idempotency-Key": "conflict"})
    assert ok.status_code == 200
    assert bad.status_code == 409

def test_invalid_public_token_404(client):
    assert client.get("/api/public/tickets/nope").status_code == 404

def test_login_and_permissions(client):
    assert client.post("/api/auth/login", json={"username": "admin", "password": "wrong"}).status_code == 401
    assert client.get("/api/staff/tickets").status_code == 401
    login(client, "owner")
    assert client.get("/api/admin/stats").status_code == 403
    client = TestClient(app, base_url="http://testserver")
    login(client, "admin")
    assert client.get("/api/admin/stats").status_code == 200


def test_admin_stats_include_order_revenue(client):
    client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 2}]})
    login(client, "admin")
    data = client.get("/api/admin/stats").json()
    assert data["total"] == 1
    assert data["total_revenue"] == "2.00"


def test_admin_stats_can_be_filtered_by_ticket_created_date(client):
    login(client, "admin")
    session = TestingSession()
    try:
        jan = Ticket(public_token="jan", customer_name="Januar", status=TicketStatus.completed, created_at=datetime(2026, 1, 10), updated_at=datetime(2026, 1, 10))
        feb = Ticket(public_token="feb", customer_name="Februar", status=TicketStatus.open, created_at=datetime(2026, 2, 10), updated_at=datetime(2026, 2, 10))
        session.add_all([
            jan,
            feb,
        ])
        session.flush()
        session.add_all([
            TicketItem(ticket_id=jan.id, product_id=1, quantity=2, product_name_snapshot="Januar Ware", unit_price_snapshot=Decimal("3.50")),
            TicketItem(ticket_id=feb.id, product_id=1, quantity=1, product_name_snapshot="Februar Ware", unit_price_snapshot=Decimal("10.00")),
        ])
        session.commit()
    finally:
        session.close()
    data = client.get("/api/admin/stats?from_date=2026-01-01&to_date=2026-01-31").json()
    assert data["total"] == 1
    assert data["completed"] == 1
    assert data["open"] == 0
    assert data["total_revenue"] == "7.00"


def test_admin_stats_reject_invalid_date_range(client):
    login(client, "admin")
    response = client.get("/api/admin/stats?from_date=2026-02-01&to_date=2026-01-01")
    assert response.status_code == 400

def test_status_change_history_and_system_message(client):
    order = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]}).json()
    session = TestingSession(); ticket_id = session.query(Ticket).first().id; session.close()
    csrf = login(client)
    response = client.patch(f"/api/staff/tickets/{ticket_id}/status", json={"status": "in_progress"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    session = TestingSession()
    try:
        assert session.query(StatusHistory).count() == 1
        message = session.query(ChatMessage).first()
        assert message.sender_type == SenderType.system
        assert "Status" in message.message
    finally:
        session.close()

def test_chat_message_persistence_service(client):
    client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]})
    session = TestingSession()
    try:
        ticket = session.query(Ticket).first()
        from app.services.chat_service import ChatService
        msg = ChatService(session).add_message(ticket, SenderType.customer, "Hallo")
        assert msg.id is not None
        assert session.query(ChatMessage).count() == 1
    finally:
        session.close()
def test_public_ticket_response_hides_internal_fields(client):
    token = client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]}).json()["ticket_token"]
    data = client.get(f"/api/public/tickets/{token}").json()
    assert "id" not in data
    assert "public_token" not in data


def test_staff_ticket_list_hides_private_token_and_marks_unread(client):
    client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]})
    session = TestingSession()
    try:
        ticket = session.query(Ticket).first()
        from app.services.chat_service import ChatService
        ChatService(session).add_message(ticket, SenderType.customer, "Hallo")
    finally:
        session.close()
    login(client)
    data = client.get("/api/staff/tickets").json()["items"][0]
    assert "public_token" not in data
    assert data["has_unread_customer_message"] is True


def test_status_changed_event_format(client):
    client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]})
    session = TestingSession()
    try:
        ticket = session.query(Ticket).first()
        user = session.query(User).filter_by(username="admin").first()
        from app.services.ticket_service import TicketService
        _message, event = TicketService(session).update_status(ticket, TicketStatus.in_progress, user)
        assert event["type"] == "status_changed"
        assert event["data"]["old_status"] == "open"
        assert event["data"]["new_status"] == "in_progress"
    finally:
        session.close()


def test_closed_ticket_rejects_chat_and_reopen_allows(client):
    client.post("/api/orders", json={"customer_name": "Max", "items": [{"product_id": 1, "quantity": 1}]})
    session = TestingSession()
    try:
        ticket = session.query(Ticket).first()
        user = session.query(User).filter_by(username="admin").first()
        from app.services.ticket_service import TicketService
        from app.services.chat_service import ChatService, ChatClosedError
        TicketService(session).update_status(ticket, TicketStatus.completed, user)
        import pytest
        with pytest.raises(ChatClosedError):
            ChatService(session).add_message(ticket, SenderType.customer, "Nope")
        TicketService(session).update_status(ticket, TicketStatus.open, user)
        msg = ChatService(session).add_message(ticket, SenderType.customer, "Wieder offen")
        assert msg.id is not None
    finally:
        session.close()


def test_login_rate_limit_blocks(client):
    codes = [client.post("/api/auth/login", json={"username": "admin", "password": "wrong"}).status_code for _ in range(6)]
    assert codes[-1] == 429


def test_order_rate_limit_blocks(client):
    codes = []
    for idx in range(11):
        codes.append(client.post("/api/orders", json={"customer_name": f"Max{idx}", "items": [{"product_id": 1, "quantity": 1}]}).status_code)
    assert codes[-1] == 429


def test_demo_seed_no_duplicates():
    from app.cli.seed_demo_data import main as seed
    from app.database import engine as app_engine
    Base.metadata.drop_all(app_engine)
    Base.metadata.create_all(app_engine)
    session = TestingSession()
    try:
        session.query(Product).delete()
        session.commit()
    finally:
        session.close()
    seed(); seed()
    from app.database import SessionLocal as AppSessionLocal
    session = AppSessionLocal()
    try:
        assert session.query(Product).count() == 3
    finally:
        session.close()


def test_delete_closed_tickets_only_removes_completed_and_not_completed(client):
    first = client.post("/api/orders", json={"customer_name": "Offen", "items": [{"product_id": 1, "quantity": 1}]}).json()
    second = client.post("/api/orders", json={"customer_name": "Fertig", "items": [{"product_id": 1, "quantity": 1}]}).json()
    third = client.post("/api/orders", json={"customer_name": "Nicht fertig", "items": [{"product_id": 1, "quantity": 1}]}).json()
    session = TestingSession()
    try:
        ids = {ticket.customer_name: ticket.id for ticket in session.query(Ticket).all()}
    finally:
        session.close()
    csrf = login(client)
    assert client.patch(f"/api/staff/tickets/{ids['Fertig']}/status", json={"status": "completed"}, headers={"X-CSRF-Token": csrf}).status_code == 200
    assert client.patch(f"/api/staff/tickets/{ids['Nicht fertig']}/status", json={"status": "not_completed"}, headers={"X-CSRF-Token": csrf}).status_code == 200
    response = client.delete("/api/staff/tickets/closed", headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200
    assert response.json()["deleted"] == 2
    stats = client.get("/api/admin/stats").json()
    assert stats["total"] == 3
    assert stats["open"] == 1
    assert stats["completed"] == 1
    assert stats["not_completed"] == 1
    assert stats["total_revenue"] == "3.00"
    session = TestingSession()
    try:
        tickets = session.query(Ticket).all()
        assert len(tickets) == 1
        assert tickets[0].customer_name == "Offen"
        assert session.query(ChatMessage).count() == 0
        assert session.query(StatusHistory).count() == 0
    finally:
        session.close()
def test_initial_migration_has_no_demo_product_inserts():
    from pathlib import Path
    text = Path("alembic/versions/0001_initial.py").read_text()
    assert "Frisches Brot" not in text
