from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import UserRole, ApplicationStatus 

# User Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.TENANT

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_verified: bool  # ✅ Naya Field (Verification Badge)
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    
# --- Property Schemas ---
class PropertyBase(BaseModel):
    title: str
    description: str
    property_type: str
    location: str
    city: str
    rent: float
    bedrooms: int
    bathrooms: int
    area: float
    parking: bool = False
    furnished: bool = False

class PropertyCreate(PropertyBase):
    pass

class PropertyImageResponse(BaseModel):
    id: int
    image_url: str

    class Config:
        from_attributes = True

class PropertyResponse(PropertyBase):
    id: int
    landlord_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    images: List[PropertyImageResponse] = []

    class Config:
        from_attributes = True
        
class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    rent: Optional[float] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    description: Optional[str] = None
    parking: Optional[bool] = None
    furnished: Optional[bool] = None
    status: Optional[str] = None

# --- Inquiry Schemas ---
class InquiryCreate(BaseModel):
    message: str

class InquiryResponse(BaseModel):
    id: int
    property_id: int
    tenant_id: int
    landlord_id: int
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Message Schemas ---
class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    property_id: Optional[int] = None
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Rental Applications ---
class ApplicationCreate(BaseModel):
    move_in_date: datetime
    occupants: int
    message: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationResponse(BaseModel):
    id: int
    property_id: int
    tenant_id: int
    landlord_id: int
    move_in_date: datetime
    occupants: int
    message: Optional[str] = None
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# === PHASE 4 NAYE SCHEMAS: Reviews ===
class ReviewCreate(BaseModel):
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: int
    property_id: int
    tenant_id: int
    rating: int
    comment: str
    created_at: datetime
    tenant: UserResponse # Tenant ki details (naam) dikhane ke liye

    class Config:
        from_attributes = True
        
# Naya top-level schema Notifications ke liye
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    related_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
        
# === NAYE SCHEMAS: Password Reset ke liye ===
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
# ... (Baqi code waisa hi rahega) ...

# === NAYE SCHEMAS: OTP Verification ke liye ===
class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class OTPResendRequest(BaseModel):
    email: EmailStr
    
# === AI Rent Predictor Schemas ===
class RentPredictionRequest(BaseModel):
    city: str
    area: float
    bedrooms: int
    bathrooms: int
    furnished: bool = False
    parking: bool = False

class RentPredictionResponse(BaseModel):
    estimated_rent: float
    price_range_min: float
    price_range_max: float
  
