from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.services import user_service
from app.models.user import User as UserModel
from app.core.auth import get_current_user, require_roles

router = APIRouter()

@router.get("/users/", response_model=list[User])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Lấy danh sách tất cả user (chỉ admin)"""
    return user_service.get_users(db)

@router.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Tạo user mới (chỉ admin)"""
    return user_service.create_user(db, user)

@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Lấy thông tin user theo ID (chỉ admin)"""
    return user_service.get_user(db, user_id)

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Cập nhật user (chỉ admin)"""
    return user_service.update_user(db, user_id, user)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Xóa user (chỉ admin)"""
    return user_service.delete_user(db, user_id)

# Endpoint hiện tại cho dashboard
@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return {"message": "Dashboard summary"}
