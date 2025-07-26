from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.class_schema import Class as ClassSchema, ClassCreate, ClassBase
from app.schemas.user import User as UserSchema
from app.CRUD import *
from app.models.class_model import Class as ClassModel
from app.services import class_service
from app.api.endpoints_ws import send_notification_to_staff

router = APIRouter()

# Giả lập user hiện tại (chưa có auth thực tế)
def get_current_user():
    return UserSchema(id=1, email="student@example.com", is_active=True, roles=["student"])

@router.get("/classes/", response_model=list[ClassSchema])
def get_all_classes(db: Session = Depends(get_db)):
    """Lấy tất cả lớp học"""
    return class_service.get_all_classes(db)

@router.post("/register_class/{class_id}")
async def register_class(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user)):
    result = class_service.register_class(db, class_id, user)
    
    # Gửi thông báo cho admin/teacher
    try:
        await send_notification_to_staff(
            notification_type="new_registration",
            message=f"Học viên {user.email} đã đăng ký lớp học mới",
            data={
                "class_id": class_id,
                "student_email": user.email,
                "student_name": user.name
            }
        )
    except Exception as e:
        print(f"Lỗi gửi thông báo: {e}")
    
    return result

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

@router.post("/classes/sample-data")
def create_sample_classes(db: Session = Depends(get_db)):
    """Tạo dữ liệu mẫu cho lớp học"""
    sample_classes = [
        {
            "name": "Lớp Python Cơ bản",
            "max_students": 25,
            "schedule": "Thứ 2, 4, 6 - 19:00-21:00",
            "course_id": 1
        },
        {
            "name": "Lớp Python Nâng cao",
            "max_students": 20,
            "schedule": "Thứ 3, 5, 7 - 19:00-21:00",
            "course_id": 1
        },
        {
            "name": "Lớp React Cơ bản",
            "max_students": 30,
            "schedule": "Thứ 2, 4, 6 - 18:00-20:00",
            "course_id": 2
        },
        {
            "name": "Lớp React Nâng cao",
            "max_students": 25,
            "schedule": "Thứ 3, 5, 7 - 18:00-20:00",
            "course_id": 2
        },
        {
            "name": "Lớp Database Design",
            "max_students": 20,
            "schedule": "Thứ 6, 7 - 14:00-17:00",
            "course_id": 3
        }
    ]
    
    created_classes = []
    for class_data in sample_classes:
        try:
            db_class = ClassModel(**class_data)
            db.add(db_class)
            created_classes.append(class_data["name"])
        except Exception as e:
            print(f"Lỗi tạo lớp {class_data['name']}: {e}")
    
    try:
        db.commit()
        return {"message": f"Đã tạo {len(created_classes)} lớp học mẫu", "classes": created_classes}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo dữ liệu mẫu: {e}") 