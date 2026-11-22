from .core.cloudinary_config import configure_cloudinary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ✅ SessionLocal yahan import kiya gaya hai
from .core.database import engine, Base, SessionLocal
from . import models
from .routers import auth, properties, admin, chat, applications, reviews, notifications

# ✅ Naye imports APScheduler aur datetime ke liye
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rental Platform API",
    description="Rental property platform with AI features",
    version="1.0.0"
)

# App define karne ke baad call karein
configure_cloudinary()

# Yeh CORS middleware frontend (React) ko backend se connect hone ki ijazat dega
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Tumhara React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers ko include karein
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(properties.router, prefix="/api/properties", tags=["Properties"])
app.include_router(admin.router, prefix="/api", tags=["Admin Moderation"]) 
app.include_router(chat.router, prefix="/api")
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(reviews.router, prefix="/api", tags=["Reviews"]) 
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"]) 

# === NAYA LOGIC: Auto-Expire Background Job ===
def check_expired_properties():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Un properties ko filter karein jo PUBLISHED hain lekin time guzar chuka hai
        expired_props = db.query(models.Property).filter(
            models.Property.status == models.PropertyStatus.PUBLISHED,
            models.Property.expires_at <= now
        ).all()

        for prop in expired_props:
            prop.status = models.PropertyStatus.EXPIRED
            
            # Landlord ko auto-notification bhejain
            notif = models.Notification(
                user_id=prop.landlord_id,
                type="PROPERTY_EXPIRED",
                message=f"Your listing '{prop.title}' has expired. Please renew it to keep it live on the platform.",
                related_id=prop.id
            )
            db.add(notif)
            
        if expired_props:
            db.commit()
            print(f"[{now}] System Auto-Expired {len(expired_props)} properties.")
    finally:
        db.close()

# ✅ FastAPI Startup Event
@app.on_event("startup")
def start_scheduler():
    scheduler = BackgroundScheduler()
    # Testing ke liye hum isay har 1 ghante mein check karne par set kar rahe hain.
    scheduler.add_job(check_expired_properties, 'interval', hours=1) 
    scheduler.start()

@app.get("/")
def root():
    return {
        "message": "Rental Platform API is running"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }