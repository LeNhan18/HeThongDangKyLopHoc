from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import User, UserCreate
from app.CRUD import create_user, get_user_by_email
from app.models.user import User as UserModel
from app.core.security import get_password_hash
from app.services import user_service
from app.models.role import Role

router = APIRouter()

def get_current_user():
    # Dummy user for example, replace with real authentication
    # Ví dụ trả về user có roles, thực tế lấy từ token/session
    return User(id=1, email="admin@gmail.com", name="Admin", is_active=True, roles=["admin"])

def require_roles(required_roles: list[str]):
    def checker(user: User = Depends(get_current_user)):
        if not any(r.lower() in [role.lower() for role in user.roles] for r in required_roles):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này.")
        return user
    return checker

@router.post("/users/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/users/", response_model=list[User])
def get_all_users(db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return user_service.get_all_users(db)

@router.get("/users/{email}", response_model=User)
def get_user(email: str, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return user_service.get_user_by_email(db, email)

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return user_service.update_user(db, user_id, user_update)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return user_service.delete_user(db, user_id)

@router.get("/roles/")
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()
