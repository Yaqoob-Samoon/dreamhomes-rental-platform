from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import json

from .. import models, schemas
from ..core.database import get_db
from ..dependencies import get_current_user
from .chat import manager  # Aap ke chat router se WebSocket manager import kiya gaya hai

router = APIRouter()

# Helper Function for Internal Use
async def create_notification(db: Session, user_id: int, type: str, message: str, related_id: int = None):
    notif = models.Notification(
        user_id=user_id, 
        type=type, 
        message=message, 
        related_id=related_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # WebSocket Real-Time Push
    ws_payload = json.dumps({
        "type": "new_notification",
        "notification": {
            "id": notif.id,
            "type": notif.type,
            "message": notif.message,
            "related_id": notif.related_id,
            "is_read": notif.is_read
        }
    })
    
    # Manager call to push event to the connected user
    try:
        await manager.send_personal_message(ws_payload, user_id)
    except Exception as e:
        print(f"WebSocket push failed (User might be offline): {e}")

    return notif

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

@router.put("/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id, 
        models.Notification.user_id == current_user.id
    ).first()
    
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}