from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.class_schema import Class as ClassSchema, ClassCreate, ClassBase
from app.schemas.user import User as UserSchema
from app.CRUD import *
from app.models.class_model import Class as ClassModel
from app.services import class_service

router = APIRouter()

# Giả lập user hiện tại (chưa có auth thực tế)
def get_current_user():
    return UserSchema(id=1, email="student@example.com", is_active=True, roles=["student"])

@router.post("/register_class/{class_id}")
def register_class(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.register_class(db, class_id, user)

@router.get("/class/{class_id}/count")
def get_class_count(class_id: int, db: Session = Depends(get_db)):
    return class_service.get_class_count(db, class_id)

@router.post("/class/{class_id}/change_schedule")
def change_class_schedule(class_id: int, new_schedule: str, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.change_class_schedule(db, class_id, new_schedule, user)

@router.get("/class/{class_id}/history")
def get_class_history(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.get_class_history(db, class_id, user)

@router.post("/class/", response_model=ClassSchema)
def create_class(class_data: ClassCreate, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.create_class(db, class_data, user)

@router.put("/class/{class_id}", response_model=ClassSchema)
def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.update_class(db, class_id, class_data, user)

@router.delete("/class/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    return class_service.delete_class(db, class_id, user) 