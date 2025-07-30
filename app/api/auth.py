from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel
from app.core.security import get_password_hash, verify_password

# Thêm prefix và tags ngay khi tạo router
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db), request: Request = None):
    """Login function với debug"""
    print(f"🔍 DEBUG: Login attempt - Email: {email}")

    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        print(f"❌ DEBUG: User not found: {email}")
        raise HTTPException(status_code=401, detail="Sai email hoặc mật khẩu")

    print(f"✅ DEBUG: Found user: ID={user.id}, Email={user.email}")

    if not verify_password(password, user.hashed_password):
        print(f"❌ DEBUG: Password verification failed for: {email}")
        raise HTTPException(status_code=401, detail="Sai email hoặc mật khẩu")

    print(f"✅ DEBUG: Password verified for user: {email}")

    # Lưu user id vào session để các request sau nhận đúng user
    if request and hasattr(request, 'session'):
        request.session["current_user_id"] = user.id
        print(f"Session set current_user_id = {user.id}")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "roles": [r.name for r in user.roles],
        "is_active": user.is_active
    }

@router.post("/logout")
def logout():
    return {"message": "Đã đăng xuất thành công"}

@router.get("/test-auth")
def test_auth():
    return {"message": "auth router is working"}