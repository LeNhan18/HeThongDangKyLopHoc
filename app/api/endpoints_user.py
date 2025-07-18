from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import User, UserCreate
from app.CRUD import create_user, get_user_by_email
from app.models.user import User as UserModel
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/users/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    return create_user(db, user)

@router.get("/users/", response_model=list[User])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()

@router.get("/users/{email}", response_model=User)
def get_user(email: str, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return db_user

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    db_user.email = str(user.email)  # type: ignore
    db_user.hashed_password = get_password_hash(user.password)  # type: ignore
    db_user.role = user.role  # type: ignore
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    db.delete(db_user)
    db.commit()
    return {"message": "Đã xóa user thành công"}
