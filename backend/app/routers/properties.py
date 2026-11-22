import joblib
import numpy as np
import os
import re
from sqlalchemy import asc, desc
from pydantic import BaseModel
from sklearn.neighbors import NearestNeighbors

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload 
from typing import List, Optional
import cloudinary.uploader
from datetime import datetime, timedelta # ✅ Added for Expiry Dates
from .. import models, schemas
from ..core.database import get_db
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    property: schemas.PropertyCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.LANDLORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only landlords can add properties")
    
    new_property = models.Property(**property.model_dump(), landlord_id=current_user.id)
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property

@router.get("/", response_model=List[schemas.PropertyResponse])
def get_properties(
    city: Optional[str] = Query(None, description="Filter by city name"),
    bedrooms: Optional[int] = Query(None, description="Filter by exact bedroom count"),
    property_type: Optional[str] = Query(None, description="Filter by type (e.g., Apartment, House)"),
    min_rent: Optional[float] = Query(None, description="Minimum rent amount"),
    max_rent: Optional[float] = Query(None, description="Maximum rent amount"),
    limit: int = Query(12, ge=1, le=100, description="Number of records to return (Pagination)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    # Only fetch properties that are officially PUBLISHED
    query = db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.status == models.PropertyStatus.PUBLISHED
    )
    
    # Dynamic Filtering
    if city:
        query = query.filter(models.Property.city.ilike(f"%{city}%"))
    if bedrooms:
        query = query.filter(models.Property.bedrooms == bedrooms)
    if property_type:
        query = query.filter(models.Property.property_type.ilike(f"%{property_type}%"))
    if min_rent is not None:
        query = query.filter(models.Property.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(models.Property.rent <= max_rent)
        
    return query.order_by(models.Property.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/me/managed", response_model=List[schemas.PropertyResponse])
def get_my_managed_properties(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.LANDLORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only landlords can access this dashboard")
    
    properties = db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.landlord_id == current_user.id
    ).order_by(models.Property.created_at.desc()).all()
    
    return properties

@router.get("/me/favorites", response_model=List[schemas.PropertyResponse])
def get_my_favorites(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    favorited_properties = db.query(models.Property).options(joinedload(models.Property.images)).join(models.Favorite).filter(
        models.Favorite.user_id == current_user.id
    ).order_by(models.Favorite.created_at.desc()).all()
    
    return favorited_properties

@router.get("/{property_id}", response_model=schemas.PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property = db.query(models.Property).options(joinedload(models.Property.images)).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return property

@router.put("/{property_id}", response_model=schemas.PropertyResponse)
def update_property(
    property_id: int, 
    property_update: schemas.PropertyUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if db_property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this property")
        
    update_data = property_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
        
    db.commit()
    db.refresh(db_property)
    return db_property

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if db_property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this property")
        
    db.delete(db_property)
    db.commit()
    return None

@router.post("/{property_id}/images", status_code=status.HTTP_201_CREATED)
def upload_property_images(
    property_id: int, 
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this property")

    uploaded_images = []
    for file in files:
        try:
            result = cloudinary.uploader.upload(file.file, folder="dreamhomes_properties")
            image_url = result.get("secure_url")
            new_image = models.PropertyImage(property_id=property_id, image_url=image_url)
            db.add(new_image)
            db.commit()
            db.refresh(new_image)
            uploaded_images.append({"id": new_image.id, "image_url": image_url})
        except Exception as e:
            db.rollback() 
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image")
    return {"message": "Images uploaded successfully", "images": uploaded_images}

@router.delete("/{property_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property_image(
    property_id: int, 
    image_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this property")
        
    image = db.query(models.PropertyImage).filter(
        models.PropertyImage.id == image_id,
        models.PropertyImage.property_id == property_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        
    db.delete(image)
    db.commit()
    return None

@router.post("/{property_id}/favorite", status_code=status.HTTP_200_OK)
def toggle_favorite(
    property_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
    existing_fav = db.query(models.Favorite).filter(
        models.Favorite.property_id == property_id,
        models.Favorite.user_id == current_user.id
    ).first()
    
    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        return {"message": "Removed from favorites", "is_favorite": False}
    else:
        new_fav = models.Favorite(property_id=property_id, user_id=current_user.id)
        db.add(new_fav)
        db.commit()
        return {"message": "Added to favorites", "is_favorite": True}

@router.post("/{property_id}/inquire", status_code=status.HTTP_201_CREATED)
def create_inquiry(
    property_id: int,
    inquiry: schemas.InquiryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can send inquiries")
        
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
    new_inquiry = models.Inquiry(
        tenant_id=current_user.id,
        landlord_id=property.landlord_id,
        property_id=property_id,
        message=inquiry.message
    )
    
    db.add(new_inquiry)
    db.commit()
    
    return {"message": "Your inquiry has been sent to the landlord successfully!"}

# === VERIFICATION & LIFECYCLE ENDPOINTS ===

@router.put("/{property_id}/submit", status_code=status.HTTP_200_OK)
def submit_property_for_review(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if db_property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to submit this property")
    if db_property.status != models.PropertyStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only DRAFT properties can be submitted for review")
    
    db_property.status = models.PropertyStatus.PENDING_REVIEW
    
    # Notify all admins
    admins = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).all()
    for admin in admins:
        new_notif = models.Notification(
            user_id=admin.id,
            type="PROPERTY_REVIEW",
            message=f"New property '{db_property.title}' has been submitted for review.",
            related_id=property_id
        )
        db.add(new_notif)

    db.commit()
    return {"message": "Property submitted for review successfully", "status": db_property.status}

@router.put("/{property_id}/approve", status_code=status.HTTP_200_OK)
def approve_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can approve properties")
        
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
    # ✅ SET PUBLISHED & 30-DAY EXPIRY
    db_property.status = models.PropertyStatus.PUBLISHED
    db_property.published_at = datetime.utcnow()
    db_property.expires_at = datetime.utcnow() + timedelta(days=30)
    
    # Notify Landlord
    new_notif = models.Notification(
        user_id=db_property.landlord_id,
        type="PROPERTY_APPROVED",
        message=f"Congratulations! Your property '{db_property.title}' is now live and will expire in 30 days.",
        related_id=property_id
    )
    db.add(new_notif)
    
    db.commit()
    return {"message": "Property approved and published successfully", "status": db_property.status, "expires_at": db_property.expires_at}

@router.put("/{property_id}/reject", status_code=status.HTTP_200_OK)
def reject_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can reject properties")
        
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
    db_property.status = models.PropertyStatus.REJECTED
    
    # Notify Landlord
    new_notif = models.Notification(
        user_id=db_property.landlord_id,
        type="PROPERTY_REJECTED",
        message=f"Your property '{db_property.title}' was rejected by the admin. Please update the details.",
        related_id=property_id
    )
    db.add(new_notif)
    
    db.commit()
    return {"message": "Property rejected", "status": db_property.status}

# ✅ NAYA ENDPOINT: RENEW LISTING (Landlord Only)
@router.put("/{property_id}/renew", status_code=status.HTTP_200_OK)
def renew_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if db_property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to renew this property")
        
    if db_property.status not in [models.PropertyStatus.PUBLISHED, models.PropertyStatus.EXPIRED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only published or expired properties can be renewed.")
        
    # Renew for another 30 days
    db_property.status = models.PropertyStatus.PUBLISHED
    db_property.expires_at = datetime.utcnow() + timedelta(days=30)
    
    db.commit()
    return {"message": "Listing renewed for 30 days.", "expires_at": db_property.expires_at}

# === PROPER AI RENT PREDICTOR ENDPOINT ===

# Load the Scikit-Learn Model on server startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ai_rent_model.pkl")
try:
    ai_model = joblib.load(MODEL_PATH)
except Exception as e:
    ai_model = None
    print(f"Warning: AI Model not found. Please run train_model.py. Error: {e}")

@router.post("/predict-rent", response_model=schemas.RentPredictionResponse)
def predict_fair_rent(features: schemas.RentPredictionRequest):
    if not ai_model:
        raise HTTPException(status_code=500, detail="AI Model is not loaded on the server.")
        
    city_map = {
        "karachi": 0, "lahore": 1, "islamabad": 2, 
        "rawalpindi": 3, "hyderabad": 4, "peshawar": 5
    }
    city_idx = city_map.get(features.city.strip().lower(), 0)
    
    # Prepare NumPy array for the ML model
    X_input = np.array([[
        city_idx,
        features.area,
        features.bedrooms,
        features.bathrooms,
        int(features.furnished),
        int(features.parking)
    ]])
    
    # Run prediction through the Random Forest Model
    prediction = ai_model.predict(X_input)[0]
    
    # ML Confidence Range based on model variance
    price_min = prediction * 0.92
    price_max = prediction * 1.08
    
    return {
        "estimated_rent": round(prediction, -2),
        "price_range_min": round(price_min, -2),
        "price_range_max": round(price_max, -2)
    }
    
# === TRUE AI PROPERTY RECOMMENDATION SYSTEM (K-Nearest Neighbors) ===

@router.get("/recommendations/me", response_model=List[schemas.PropertyResponse])
def get_property_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants get recommendations")

    # 1. Fetch user's favorites
    favorites = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).all()
    fav_property_ids = [f.property_id for f in favorites]

    # 2. Fetch all PUBLISHED properties for the AI to analyze
    all_properties = db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.status == models.PropertyStatus.PUBLISHED
    ).all()

    if not all_properties:
        return []

    # COLD START: Agar user naya hai, toh latest properties dikhayen
    if not fav_property_ids:
        return sorted(all_properties, key=lambda x: x.created_at, reverse=True)[:6]

    # 3. Enterprise ML: Prepare Feature Matrix for KNN
    city_map = {"karachi": 0, "lahore": 1, "islamabad": 2, "rawalpindi": 3, "hyderabad": 4, "peshawar": 5}
    feature_matrix = []
    prop_id_map = {} 
    
    for idx, p in enumerate(all_properties):
        city_val = city_map.get(p.city.strip().lower(), 0)
        # Features ko normalize kar rahe hain taake koi ek value (jaise rent) result kharab na kare
        rent_norm = float(p.rent) / 100000.0 if p.rent else 0
        area_norm = float(p.area) / 1000.0 if p.area else 0
        
        feature_matrix.append([
            city_val, 
            rent_norm, 
            area_norm, 
            float(p.bedrooms or 0), 
            float(p.bathrooms or 0),
            float(p.furnished or 0)
        ])
        prop_id_map[idx] = p

    X = np.array(feature_matrix)

    # 4. Train the KNN Model dynamically on live inventory
    n_neighbors = min(6 + len(fav_property_ids), len(all_properties))
    knn = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine')
    knn.fit(X)

    # 5. Create "User Profile Vector" (Average of their favorite properties)
    fav_props = [p for p in all_properties if p.id in fav_property_ids]
    user_vector = np.zeros(6)
    
    for p in fav_props:
        city_val = city_map.get(p.city.strip().lower(), 0)
        user_vector += np.array([
            city_val, 
            float(p.rent) / 100000.0 if p.rent else 0, 
            float(p.area) / 1000.0 if p.area else 0, 
            float(p.bedrooms or 0), 
            float(p.bathrooms or 0),
            float(p.furnished or 0)
        ])
    
    # Calculate average preferences
    user_vector = user_vector / len(fav_props)

    # 6. AI Prediction: Find the most mathematically similar properties
    distances, indices = knn.kneighbors([user_vector])
    
    recommendations = []
    for idx in indices[0]:
        prop = prop_id_map[idx]
        # Pehle se favorite ki hui properties ko dubara suggest mat karo
        if prop.id not in fav_property_ids:
            recommendations.append(prop)
        if len(recommendations) == 6:
            break

    # 7. Fallback: Agar machine learning ke baad properties 6 se kam bachein
    if len(recommendations) < 6:
        for p in all_properties:
            if p.id not in fav_property_ids and p not in recommendations:
                recommendations.append(p)
            if len(recommendations) == 6:
                break

    return recommendations

# === ADVANCED AI CHATBOT (NATURAL LANGUAGE SEARCH) ===

class ChatRequest(BaseModel):
    message: str
    context_ids: Optional[List[int]] = []

@router.post("/assistant/chat")
def ai_assistant_search(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    text = request.message.lower()

    # 1. SMART MEMORY: Agar user "behtar" ya "best" puche, toh pichli properties mein se sab se sasti/achi nikal kar do
    is_best_intent = any(w in text for w in ['behtar', 'best', 'acha', 'top', 'zabardast'])
    if is_best_intent and request.context_ids:
        # Pichli properties mein se lowest rent wali ko best consider karein (value for money)
        best_prop = db.query(models.Property).options(joinedload(models.Property.images)).filter(
            models.Property.id.in_(request.context_ids)
        ).order_by(asc(models.Property.rent)).limit(1).all()
        
        if best_prop:
            return {
                "reply": "In mein se meri nazar mein yeh sab se behtar (value for money) hai:",
                "properties": best_prop
            }

    # 2. Entity Extraction Setup
    city = None
    max_rent = None
    beds = None
    prop_type = None
    sort_by = None

    # City Detection
    cities = {
        'karachi': ['karachi', 'khi'],
        'lahore': ['lahore', 'lhr'],
        'islamabad': ['islamabad', 'isb'],
        'rawalpindi': ['rawalpindi', 'pindi'],
        'hyderabad': ['hyderabad', 'hyd'],
        'peshawar': ['peshawar', 'psh']
    }
    for main_city, aliases in cities.items():
        if any(alias in text for alias in aliases):
            city = main_city
            break

    # Budget Extraction
    budget_match = re.search(r'(\d+(\.\d+)?)\s*(k|lac|lakh|000)', text.replace(',', ''))
    if budget_match:
        val = float(budget_match.group(1))
        multiplier = budget_match.group(3)
        if multiplier in ['lac', 'lakh']:
            max_rent = int(val * 100000)
        elif multiplier == 'k':
            max_rent = int(val * 1000)
        else:
            max_rent = int(val * 1000)
    else:
        exact_num = re.search(r'\b([1-9]\d{3,6})\b', text.replace(',', ''))
        if exact_num:
            max_rent = int(exact_num.group(1))

    # Bedroom Extraction
    word_to_num = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5}
    bed_match = re.search(r'(\d+|one|two|three|four|five)\s*(-)?\s*(bed|bhk|bedroom|room)', text)
    if bed_match:
        b_val = bed_match.group(1)
        beds = int(b_val) if b_val.isdigit() else word_to_num.get(b_val, 1)

    # ROMAN URDU Property Type Detection
    if any(w in text for w in ['apartment', 'flat', 'portion']):
        prop_type = 'Apartment'
    elif any(w in text for w in ['house', 'banglow', 'villa', 'home', 'ghar', 'makan']):
        prop_type = 'House'
    elif any(w in text for w in ['commercial', 'shop', 'office', 'dukaan']):
        prop_type = 'Commercial'
    elif any(w in text for w in ['hostel', 'pg']):
        prop_type = 'Hostel'

    # Intent Analysis
    if any(w in text for w in ['cheap', 'affordable', 'low budget', 'sasta', 'kam']):
        sort_by = 'cheap'
    elif any(w in text for w in ['luxury', 'premium', 'expensive', 'vip', 'high end']):
        sort_by = 'luxury'

    # Database Query
    query = db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.status == models.PropertyStatus.PUBLISHED
    )
    
    if city:
        query = query.filter(models.Property.city.ilike(f"%{city}%"))
    if beds:
        query = query.filter(models.Property.bedrooms == beds)
    if max_rent:
        query = query.filter(models.Property.rent <= max_rent)
    if prop_type:
        query = query.filter(models.Property.property_type.ilike(f"%{prop_type}%"))
        
    if sort_by == 'cheap':
        query = query.order_by(asc(models.Property.rent))
    elif sort_by == 'luxury':
        query = query.order_by(desc(models.Property.rent))
    else:
        query = query.order_by(models.Property.created_at.desc())
        
    results = query.limit(3).all()
    
    if not results:
        reply_text = "Maaf kijiye ga, mujhe is criteria ke mutabiq koi property nahi mili. Thora budget ya location change kar ke try karein."
    else:
        criteria = []
        if beds: criteria.append(f"{beds}-Bed")
        if prop_type: criteria.append(prop_type)
        if city: criteria.append(f"in {city.title()}")
        if max_rent: criteria.append(f"under PKR {max_rent:,}")
        
        if criteria:
            desc_str = " ".join(criteria)
            if sort_by == 'cheap':
                reply_text = f"Zaroor! Yeh rahi sab se sasti {desc_str} ki properties:"
            elif sort_by == 'luxury':
                reply_text = f"Bilkool, yeh check karein premium {desc_str} ki properties:"
            else:
                reply_text = f"Yeh lijiye! Mujhe {desc_str} ki behtareen properties mili hain:"
        else:
            reply_text = "Yeh rahi hamari kuch latest properties jo aap ko pasand aa sakti hain:"
            
    return {
        "reply": reply_text,
        "properties": results
    }