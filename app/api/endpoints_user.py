from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.services import user_service
from app.models.user import User as UserModel
from app.models.role import Role as RoleModel
from app.core.auth import get_current_user_debug
from app.core.permissions import require_roles
from app.api.endpoints_ws import send_notification_to_staff

router = APIRouter()

@router.get("/test-users/")
def test_list_users(db: Session = Depends(get_db)):
    """Endpoint test để lấy danh sách users không yêu cầu authentication"""
    return user_service.get_users(db)

@router.get("/roles/")
def get_roles(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả roles"""
    # Kiểm tra nếu chưa có roles thì tạo mẫu
    roles_count = db.query(RoleModel).count()
    if roles_count == 0:
        # Tạo roles mẫu
        sample_roles = ["admin", "teacher", "student"]
        for role_name in sample_roles:
            role = RoleModel(name=role_name)
            db.add(role)
        db.commit()
    
    roles = db.query(RoleModel).all()
    return [{"id": role.id, "name": role.name} for role in roles]

@router.post("/users/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký user mới"""
    new_user = user_service.create_user(db, user)
    
    # Gửi thông báo cho admin/teacher
    await send_notification_to_staff(
        "new_registration",
        f"User mới đăng ký: {new_user.name} ({new_user.email})",
        {"user_id": new_user.id, "email": new_user.email, "name": new_user.name}
    )
    
    return new_user

@router.get("/users/", response_model=list[User])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Lấy danh sách tất cả user (chỉ admin)"""
    return user_service.get_users(db)

@router.post("/users/", response_model=User)
async def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin"]))):
    """Tạo user mới (chỉ admin)"""
    new_user = user_service.create_user(db, user)
    
    # Gửi thông báo cho admin/teacher
    await send_notification_to_staff(
        "new_registration",
        f"Admin đã tạo user mới: {new_user.name} ({new_user.email})",
        {"user_id": new_user.id, "email": new_user.email, "name": new_user.name}
    )
    
    return new_user

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
