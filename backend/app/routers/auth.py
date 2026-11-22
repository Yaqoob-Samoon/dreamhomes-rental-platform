import secrets
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

from .. import models, schemas
from ..core.database import get_db
from ..core.security import get_password_hash, verify_password, create_access_token
from ..core.email import send_otp_email, send_reset_password_email

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter()

# 1. REGISTER (OTP Generate & Send)
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        phone=user.phone,
        role=user.role,
        is_verified=False,
        verification_token=otp_code, # Reusing this column for OTP
        reset_password_expires=otp_expiry # Reusing this column for OTP expiry to avoid DB schema drops
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    background_tasks.add_task(send_otp_email, new_user.email, otp_code)
    return new_user

# 2. VERIFY OTP
@router.post("/verify-otp")
def verify_otp(request: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_verified:
        return {"message": "Account is already verified."}
        
    if user.verification_token != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    if user.reset_password_expires and user.reset_password_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully! You can now log in."}

# 3. RESEND OTP
@router.post("/resend-otp")
def resend_otp(request: schemas.OTPResendRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Account is already verified."}
        
    new_otp = str(random.randint(100000, 999999))
    user.verification_token = new_otp
    user.reset_password_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    background_tasks.add_task(send_otp_email, user.email, new_otp)
    return {"message": "A new OTP has been sent to your email."}

# 4. LOGIN (Strict Verification Check)
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_verified:
        # Returning a specific 403 error so frontend knows to redirect to OTP screen
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="NOT_VERIFIED" 
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

# 5. CURRENT USER INFO
@router.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_info(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        return user
        
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# === FORGOT & RESET PASSWORD ENDPOINTS ===

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        background_tasks.add_task(send_reset_password_email, user.email, reset_token)
        
    # Security best practice: Hamesha same message return karein taake koi guess na kar sake ke email system mein hai ya nahi
    return {"message": "If that email is registered, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.reset_password_token == request.token,
        models.User.reset_password_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user.password_hash = get_password_hash(request.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    db.commit()
    
    return {"message": "Password has been reset successfully. You can now log in."}