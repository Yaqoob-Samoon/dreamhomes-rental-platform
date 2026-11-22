from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
from .. import models, schemas
from ..core.database import get_db
from ..dependencies import get_current_user

# Prefix aur Tags set kar rahe hain taake Swagger UI mein alag nazar aaye
router = APIRouter(
    prefix="/admin",
    tags=["Admin Moderation"]
)

# === Helper Dependency: Sirf Admin ko allow karne ke liye ===
def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. Only Super Admins can perform this action."
        )
    return current_user

# === 1. GET ALL USERS (Platform ke sab users dekhne ke liye) ===
@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

# === 2. BLOCK / UNBLOCK USER ===
@router.put("/users/{user_id}/block")
def toggle_user_block(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot block another Admin")
        
    # Toggle block status
    user.is_blocked = not user.is_blocked
    db.commit()
    
    status_msg = "blocked" if user.is_blocked else "unblocked"
    return {"message": f"User '{user.name}' has been {status_msg} successfully."}

# === 3. GET PENDING PROPERTIES ===
@router.get("/properties/pending", response_model=List[schemas.PropertyResponse])
def get_pending_properties(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    # ✅ FIX: Use models.PropertyStatus.PENDING_REVIEW and joinedload for images
    return db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.status == models.PropertyStatus.PENDING_REVIEW
    ).order_by(models.Property.created_at.desc()).all()

# Schema for updating property status
class PropertyStatusUpdate(BaseModel):
    status: str  # 'PUBLISHED' ya 'REJECTED'

# === 4. APPROVE / REJECT PROPERTY ===
@router.put("/properties/{property_id}/status")
def update_property_status(
    property_id: int, 
    status_update: PropertyStatusUpdate, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(check_admin)
):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
    # ✅ FIX: Handle mapping string to the actual Enum
    try:
        new_status = models.PropertyStatus(status_update.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid status provided. Use 'PUBLISHED' or 'REJECTED'."
        )
        
    property.status = new_status
    db.commit()
    
    return {"message": f"Property '{property.title}' has been marked as {new_status.value}."}