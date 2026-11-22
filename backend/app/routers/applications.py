from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..core.database import get_db
from ..dependencies import get_current_user
from .notifications import create_notification
from ..core.email import send_email_sync

router = APIRouter()

# 1. Tenant: Apply for a property
@router.post("/{property_id}", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_property(
    property_id: int,
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can apply for properties.")

    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Check karna ke kahin pehle se toh apply nahi kiya hua
    existing_app = db.query(models.RentalApplication).filter(
        models.RentalApplication.property_id == property_id,
        models.RentalApplication.tenant_id == current_user.id
    ).first()
    
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this property.")

    new_application = models.RentalApplication(
        tenant_id=current_user.id,
        landlord_id=property.landlord_id,
        property_id=property_id,
        move_in_date=application.move_in_date,
        occupants=application.occupants,
        message=application.message
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # Landlord ko In-App aur WebSocket Notification bhejein
    msg = f"New rental application received for your property #{property_id}."
    await create_notification(db, property.landlord_id, "NEW_APPLICATION", msg, property_id)

    return new_application

# 2. Tenant: Apni bheji hui applications dekhna
@router.get("/me", response_model=List[schemas.ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can view their applications.")
    
    apps = db.query(models.RentalApplication).filter(
        models.RentalApplication.tenant_id == current_user.id
    ).order_by(models.RentalApplication.created_at.desc()).all()
    return apps

# 3. Landlord: Apni properties par aayi hui applications dekhna
@router.get("/managed", response_model=List[schemas.ApplicationResponse])
def get_received_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.LANDLORD:
        raise HTTPException(status_code=403, detail="Only landlords can view received applications.")
    
    apps = db.query(models.RentalApplication).filter(
        models.RentalApplication.landlord_id == current_user.id
    ).order_by(models.RentalApplication.created_at.desc()).all()
    return apps

# 4. Landlord: Application ka status Approve ya Reject karna
@router.put("/{application_id}/status", response_model=schemas.ApplicationResponse)
async def update_application_status(
    application_id: int,
    status_update: schemas.ApplicationUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.LANDLORD:
        raise HTTPException(status_code=403, detail="Only landlords can update application status.")
    
    app = db.query(models.RentalApplication).filter(models.RentalApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    if app.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application.")
        
    app.status = status_update.status
    
    # 1. Tenant ki details fetch karein email bhejne ke liye
    tenant = db.query(models.User).filter(models.User.id == app.tenant_id).first()

    # 2. In-App Notifications aur Email trigger karein
    if status_update.status in ["APPROVED", "REJECTED"]:
        msg = f"Your application for property #{app.property_id} has been {status_update.status.lower()}."
        
        # Real-time WebSocket push aur database notification
        await create_notification(db, app.tenant_id, "APPLICATION_STATUS", msg, app.property_id)
        
        # Background mein sync email send karein (API ko slow kiye baghair)
        if tenant and tenant.email:
            subject = f"Application {status_update.status.capitalize()}"
            background_tasks.add_task(send_email_sync, tenant.email, subject, msg)
    
    # 3. Agar approve ho jaye toh property ko 'RENTED' mark karein aur baqi reject karein
    if status_update.status == "APPROVED":
        property = db.query(models.Property).filter(models.Property.id == app.property_id).first()
        if property:
            # ✅ FIX: Updated from string "rented" to models.PropertyStatus.RENTED (Enum)
            property.status = models.PropertyStatus.RENTED
            
            other_apps = db.query(models.RentalApplication).filter(
                models.RentalApplication.property_id == app.property_id,
                models.RentalApplication.id != app.id,
                models.RentalApplication.status == "PENDING"
            ).all()
            
            for other_app in other_apps:
                other_app.status = "REJECTED"

    db.commit()
    db.refresh(app)
    return app