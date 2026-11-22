from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..core.database import get_db
from ..dependencies import get_current_user
from .notifications import create_notification  # ✅ Notification helper import kiya

router = APIRouter()

@router.post("/properties/{property_id}/reviews", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(  # ✅ Is function ko 'async' kar diya gaya hai
    property_id: int, 
    review: schemas.ReviewCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can leave reviews.")
    
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
        
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Check karna ke tenant ne pehle se review toh nahi diya hua
    existing_review = db.query(models.Review).filter(
        models.Review.property_id == property_id,
        models.Review.tenant_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this property.")

    new_review = models.Review(
        tenant_id=current_user.id,
        property_id=property_id,
        rating=review.rating,
        comment=review.comment
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # ✅ NAYI LOGIC: Landlord ko notification bhejein
    if property:
        msg = f"New {new_review.rating}-star review received on property #{property_id}."
        await create_notification(db, property.landlord_id, "NEW_REVIEW", msg, property_id)

    return new_review

@router.get("/properties/{property_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_property_reviews(property_id: int, db: Session = Depends(get_db)):
    # joinedload use kiya hai taake N+1 query problem na aaye jab tenant ki details fetch hon
    reviews = db.query(models.Review).options(joinedload(models.Review.tenant)).filter(
        models.Review.property_id == property_id
    ).order_by(models.Review.created_at.desc()).all()
    
    return reviews