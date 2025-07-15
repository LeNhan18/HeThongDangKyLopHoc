from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import User, UserCreate
from app.CRUD import create_user, get_user_by_email

router = APIRouter()

@router.post("/users/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    return create_user(db, user)

@router.get("/users/{email}", response_model=User)
def get_user(email: str, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return db_user 