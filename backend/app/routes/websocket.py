from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlalchemy import select
from app.config import get_settings
from app.database import SessionLocal
from app.models import SenderType, Ticket, User, UserRole
from app.schemas.chat import ChatIn
from app.security.rate_limit import limiter
from app.security.sessions import COOKIE_NAME, read_session
from app.services.chat_service import ChatClosedError, ChatService
from app.websocket.manager import manager, ticket_room

router = APIRouter(tags=["websocket"])

def origin_allowed(websocket: WebSocket) -> bool:
    origin = websocket.headers.get("origin")
    if not origin:
        return True
    return origin in get_settings().origins

async def close_with_code(websocket: WebSocket, code: int) -> None:
    await websocket.accept()
    await websocket.close(code=code)

async def send_error(websocket: WebSocket, message: str) -> bool:
    try:
        await websocket.send_json(ChatService.error(message))
        return True
    except (WebSocketDisconnect, RuntimeError):
        return False

def find_ticket_id(token: str) -> int | None:
    db = SessionLocal()
    try:
        ticket = db.scalar(select(Ticket).where(Ticket.public_token == token))
        return ticket.id if ticket else None
    finally:
        db.close()

def find_staff_context(ticket_id: int, session_cookie: str | None) -> tuple[int, UserRole, int] | None:
    user_id = read_session(session_cookie)
    if not user_id:
        return None
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        ticket = db.get(Ticket, ticket_id)
        if not user or not user.is_active or not ticket:
            return None
        return user.id, user.role, ticket.id
    finally:
        db.close()

@router.websocket("/ws/tickets/{token}")
async def customer_ws(websocket: WebSocket, token: str):
    if not origin_allowed(websocket):
        await close_with_code(websocket, 4403)
        return
    ticket_id = find_ticket_id(token)
    if not ticket_id:
        await close_with_code(websocket, 4404)
        return
    room = ticket_room(ticket_id)
    try:
        await manager.connect(room, websocket)
        while True:
            try:
                if not limiter.allow(f"ws_customer:{ticket_id}", 30, 60):
                    if not await send_error(websocket, "Zu viele Nachrichten. Bitte warte kurz."):
                        break
                    continue
                payload = ChatIn(**await websocket.receive_json())
                db = SessionLocal()
                try:
                    ticket = db.get(Ticket, ticket_id)
                    if not ticket:
                        if not await send_error(websocket, "Ticket nicht gefunden."):
                            break
                        continue
                    msg = ChatService(db).add_message(ticket, SenderType.customer, payload.message)
                    event = ChatService.event(msg)
                finally:
                    db.close()
                await manager.broadcast(room, event)
            except WebSocketDisconnect:
                raise
            except ChatClosedError as exc:
                if not await send_error(websocket, str(exc)):
                    break
            except (ValidationError, ValueError):
                if not await send_error(websocket, "Nachricht ist leer oder zu lang."):
                    break
            except Exception:
                if not await send_error(websocket, "Nachricht konnte nicht verarbeitet werden."):
                    break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room, websocket)

@router.websocket("/ws/staff/tickets/{ticket_id}")
async def staff_ws(websocket: WebSocket, ticket_id: int):
    if not origin_allowed(websocket):
        await close_with_code(websocket, 4403)
        return
    context = find_staff_context(ticket_id, websocket.cookies.get(COOKIE_NAME))
    if not context:
        await close_with_code(websocket, 4401)
        return
    user_id, user_role, valid_ticket_id = context
    room = ticket_room(valid_ticket_id)
    try:
        await manager.connect(room, websocket)
        while True:
            try:
                if not limiter.allow(f"ws_staff:{user_id}:{valid_ticket_id}", 60, 60):
                    if not await send_error(websocket, "Zu viele Nachrichten. Bitte warte kurz."):
                        break
                    continue
                payload = ChatIn(**await websocket.receive_json())
                db = SessionLocal()
                try:
                    ticket = db.get(Ticket, valid_ticket_id)
                    if not ticket:
                        if not await send_error(websocket, "Ticket nicht gefunden."):
                            break
                        continue
                    sender = SenderType.admin if user_role == UserRole.admin else SenderType.owner
                    msg = ChatService(db).add_message(ticket, sender, payload.message, user_id)
                    event = ChatService.event(msg)
                finally:
                    db.close()
                await manager.broadcast(room, event)
            except WebSocketDisconnect:
                raise
            except ChatClosedError as exc:
                if not await send_error(websocket, str(exc)):
                    break
            except (ValidationError, ValueError):
                if not await send_error(websocket, "Nachricht ist leer oder zu lang."):
                    break
            except Exception:
                if not await send_error(websocket, "Nachricht konnte nicht verarbeitet werden."):
                    break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room, websocket)