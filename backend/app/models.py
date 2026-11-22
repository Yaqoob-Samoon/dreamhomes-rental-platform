from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .core.database import Base

class UserRole(str, enum.Enum):
    TENANT = "TENANT"
    LANDLORD = "LANDLORD"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class PropertyStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"
    RENTED = "RENTED"
    ARCHIVED = "ARCHIVED"

# app/models.py (Baqi models waise hi rahenge, sirf User class mein yeh naye columns add karein)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.TENANT)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    is_blocked = Column(Boolean, default=False)
    
    # ✅ EMAIL VERIFICATION & PASSWORD RESET FIELDS
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True, index=True)
    reset_password_token = Column(String, nullable=True, index=True)
    reset_password_expires = Column(DateTime, nullable=True)

    # Relationships (Existing)
    properties = relationship("Property", back_populates="landlord")
    favorites = relationship("Favorite", back_populates="user")
    inquiries_sent = relationship("Inquiry", foreign_keys="[Inquiry.tenant_id]", back_populates="tenant")
    applications_sent = relationship("RentalApplication", foreign_keys="[RentalApplication.tenant_id]", back_populates="tenant")
    applications_received = relationship("RentalApplication", foreign_keys="[RentalApplication.landlord_id]", back_populates="landlord")
    reviews_given = relationship("Review", foreign_keys="[Review.tenant_id]", back_populates="tenant")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    landlord_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(String)
    property_type = Column(String)
    location = Column(String, index=True)
    city = Column(String, index=True)
    rent = Column(Float, index=True)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    area = Column(Float)
    parking = Column(Boolean, default=False)
    furnished = Column(Boolean, default=False)
    
    status = Column(Enum(PropertyStatus), default=PropertyStatus.DRAFT)
    
    # ✅ NAYE COLUMNS: Listing Lifecycle (30-day expiry)
    published_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    landlord = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="property")
    inquiries = relationship("Inquiry", back_populates="property")
    applications = relationship("RentalApplication", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    image_url = Column(String)

    property = relationship("Property", back_populates="images")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorited_by")

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"))
    landlord_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    message = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="inquiries_sent")
    landlord = relationship("User", foreign_keys=[landlord_id])
    property = relationship("Property", back_populates="inquiries")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    property = relationship("Property")

class RentalApplication(Base):
    __tablename__ = "rental_applications"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"))
    landlord_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    
    move_in_date = Column(DateTime)
    occupants = Column(Integer)
    message = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="applications_sent")
    landlord = relationship("User", foreign_keys=[landlord_id], back_populates="applications_received")
    property = relationship("Property", back_populates="applications")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    rating = Column(Integer)
    comment = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="reviews_given")
    property = relationship("Property", back_populates="reviews")
    
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String) 
    message = Column(String)
    related_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")