from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel
from app.core.security import get_password_hash, verify_password

# Thêm prefix và tags ngay khi tạo router
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Sai email hoặc mật khẩu")
    
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