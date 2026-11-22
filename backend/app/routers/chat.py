from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status, Query, Request, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

from .. import models, schemas
from ..core.database import get_db

# 1. .env file se secure keys load karein
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/chat", tags=["Live Chat"])

# Active WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        # Dictionary to store active connections by user_id: {user_id: WebSocket}
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# 🔒 SECURE WEBSOCKET ENDPOINT (Enterprise Grade)
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(...), # Token query parameter se aayega
    db: Session = Depends(get_db)
):
    try:
        # 1. Verify Token and Extract User
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check numeric ID or fetch from email
        current_user_id = payload.get("id")
        if not current_user_id:
            email = payload.get("sub")
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                current_user_id = user.id
                
        if not current_user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Accept Secure Connection
    await manager.connect(current_user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            property_id = data.get("property_id")
            message_text = data.get("message")

            if not receiver_id or not message_text:
                continue

            # Save message in database
            new_message = models.Message(
                sender_id=current_user_id,
                receiver_id=receiver_id,
                property_id=property_id,
                message=message_text,
                is_read=False # Naya message hamesha unread hoga
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            message_payload = {
                "id": new_message.id,
                "sender_id": current_user_id,
                "receiver_id": receiver_id,
                "property_id": property_id,
                "message": message_text,
                "created_at": new_message.created_at.isoformat(),
                "is_read": False
            }

            # Send to receiver and echo back to sender
            await manager.send_personal_message(message_payload, receiver_id)
            await manager.send_personal_message(message_payload, current_user_id)

    except WebSocketDisconnect:
        manager.disconnect(current_user_id)

# 🔒 SECURE CHAT HISTORY API
@router.get("/history/{receiver_id}", response_model=List[schemas.MessageResponse])
def get_chat_history(receiver_id: int, request: Request, db: Session = Depends(get_db)):
    # Automatically get token from Authorization header (Bearer)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user_id = payload.get("id")
        if not current_user_id:
            email = payload.get("sub")
            user = db.query(models.User).filter(models.User.email == email).first()
            current_user_id = user.id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Fetch history securely
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user_id) & (models.Message.receiver_id == receiver_id)) |
        ((models.Message.sender_id == receiver_id) & (models.Message.receiver_id == current_user_id))
    ).order_by(models.Message.created_at.asc()).all()
    
    return messages


# --- NAYE NOTIFICATION AUR READ RECEIPTS ENDPOINTS YAHAN HAIN ---

# 🔔 UNREAD MESSAGES COUNT API (Notifications ke liye)
@router.get("/notifications/unread")
def get_unread_count(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"unread_count": 0}
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            return {"unread_count": 0}
            
        # Check how many messages sent TO this user are unread
        count = db.query(models.Message).filter(
            models.Message.receiver_id == user.id,
            models.Message.is_read == False
        ).count()
        
        return {"unread_count": count}
    except JWTError:
        return {"unread_count": 0}

# 👁️ MARK MESSAGES AS READ API (Chat open hone par call hogi)
@router.put("/mark-read/{sender_id}")
def mark_messages_read(sender_id: int, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        current_user = db.query(models.User).filter(models.User.email == email).first()
        
        if not current_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        # Update all unread messages from this specific sender to 'read'
        db.query(models.Message).filter(
            models.Message.receiver_id == current_user.id,
            models.Message.sender_id == sender_id,
            models.Message.is_read == False
        ).update({"is_read": True})
        
        db.commit()
        return {"status": "success"}
        
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# 📥 GET INBOX CONVERSATIONS API (Sidebar ke liye)
@router.get("/inbox")
def get_inbox(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        current_user = db.query(models.User).filter(models.User.email == email).first()
        
        if not current_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Get all messages sent or received by current user
        messages = db.query(models.Message).filter(
            (models.Message.sender_id == current_user.id) |
            (models.Message.receiver_id == current_user.id)
        ).order_by(models.Message.created_at.desc()).all()

        conversations = {}
        for msg in messages:
            # Determine the other user in the conversation
            other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
            
            # Keep only the latest message per user
            if other_user_id not in conversations:
                other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
                
                # Count unread messages from this specific user
                unread = db.query(models.Message).filter(
                    models.Message.sender_id == other_user_id,
                    models.Message.receiver_id == current_user.id,
                    models.Message.is_read == False
                ).count()

                conversations[other_user_id] = {
                    "other_user_id": other_user_id,
                    "other_user_name": other_user.name if other_user else "Unknown User",
                    "last_message": msg.message,
                    "property_id": msg.property_id,
                    "unread_count": unread
                }

        return list(conversations.values())
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")