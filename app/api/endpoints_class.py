from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.class_schema import Class as ClassSchema, ClassCreate, ClassBase
from app.schemas.user import User as UserSchema
from app.CRUD import *
from app.models.class_model import Class as ClassModel
from app.models.course import Course as CourseModel
from app.services import class_service
from app.api.endpoints_ws import send_notification_to_staff
from app.models.user import User as UserModel
from app.core.auth import get_current_user_debug

router = APIRouter()


@router.get("/classes/")  # Bỏ response_model=list[ClassSchema]
def get_all_classes(db: Session = Depends(get_db)):
    classes = class_service.get_all_classes(db)
    return [
        {
            "id": cls.id,
            "name": cls.name,
            "max_students": cls.max_students,
            "schedule": cls.schedule,
            "course_id": cls.course_id,
            "course": None
        }
        for cls in classes
    ]

@router.post("/register_class/{class_id}")
async def register_class_endpoint(
    class_id: int, 
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user_debug)
):
    """Debug registration endpoint"""
    print(f"🔍 DEBUG: Registration endpoint called")
    print(f"🔍 DEBUG: Class ID: {class_id}")
    print(f"🔍 DEBUG: Current user from dependency: ID={current_user.id}, Email={current_user.email}")
    print(f"🔍 DEBUG: User roles: {current_user.roles}")
    
    return class_service.register_class(db, class_id, current_user)

@router.post("/register_class_old/{class_id}")
async def register_class_old(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    """Old registration endpoint for backward compatibility"""
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
def change_class_schedule(class_id: int, new_schedule: str, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.change_class_schedule(db, class_id, new_schedule, user)

@router.get("/class/{class_id}/history")
def get_class_history(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.get_class_history(db, class_id, user)

@router.post("/class/", response_model=ClassSchema)
def create_class(class_data: ClassCreate, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.create_class(db, class_data, user)

@router.put("/class/{class_id}", response_model=ClassSchema)
def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.update_class(db, class_id, class_data, user)

@router.delete("/class/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.delete_class(db, class_id, user) 

@router.post("/class/{class_id}/assign_course/{course_id}")
def assign_course_to_class(
    class_id: int, 
    course_id: int, 
    db: Session = Depends(get_db), 
    user: UserSchema = Depends(get_current_user_debug)
):
    """Gán khóa học vào lớp học"""
    return class_service.assign_course_to_class(db, class_id, course_id, user)

@router.delete("/class/{class_id}/remove_course")
def remove_course_from_class(
    class_id: int, 
    db: Session = Depends(get_db), 
    user: UserSchema = Depends(get_current_user_debug)
):
    """Xóa khóa học khỏi lớp học"""
    return class_service.remove_course_from_class(db, class_id, user)

@router.get("/class/{class_id}/course")
def get_class_course(
    class_id: int, 
    db: Session = Depends(get_db)
):
    """Lấy thông tin khóa học của lớp học"""
    return class_service.get_class_course(db, class_id)

@router.get("/course/{course_id}/classes")
def get_classes_by_course(
    course_id: int, 
    db: Session = Depends(get_db)
):
    """Lấy tất cả lớp học của một khóa học"""
    return class_service.get_classes_by_course(db, course_id)

@router.get("/class/{class_id}/students")
def get_class_students(
    class_id: int, 
    db: Session = Depends(get_db)
):
    """Lấy danh sách học viên trong lớp học"""
    return class_service.get_class_students(db, class_id)

@router.get("/class/{class_id}/students/count")
def get_class_students_count(
    class_id: int, 
    db: Session = Depends(get_db)
):
    """Lấy số lượng học viên trong lớp học"""
    return class_service.get_class_students_count(db, class_id)

@router.delete("/registrations/clear")
def clear_all_registrations(db: Session = Depends(get_db)):
    """Xóa tất cả đăng ký (chỉ để test)"""
    from app.models.registration import Registration
    db.query(Registration).delete()
    db.commit()
    return {"message": "Đã xóa tất cả đăng ký"}

@router.get("/registrations/check")
def check_registrations(db: Session = Depends(get_db)):
    """Kiểm tra đăng ký hiện tại"""
    from app.models.registration import Registration
    registrations = db.query(Registration).all()
    return {
        "total_registrations": len(registrations),
        "registrations": [
            {"student_id": reg.student_id, "class_id": reg.class_id} 
            for reg in registrations
        ]
    }

# @router.post("/classes/sample-data")
# def create_sample_classes(db: Session = Depends(get_db)):
#     """Tạo dữ liệu mẫu cho lớp học"""
#     sample_classes = [
#         {
#             "name": "Lớp Python Cơ bản",
#             "max_students": 25,
#             "schedule": "Thứ 2, 4, 6 - 19:00-21:00"
#         },
#         {
#             "name": "Lớp Python Nâng cao",
#             "max_students": 20,
#             "schedule": "Thứ 3, 5, 7 - 19:00-21:00"
#         },
#         {
#             "name": "Lớp React Cơ bản",
#             "max_students": 30,
#             "schedule": "Thứ 2, 4, 6 - 18:00-20:00"
#         },
#         {
#             "name": "Lớp React Nâng cao",
#             "max_students": 25,
#             "schedule": "Thứ 3, 5, 7 - 18:00-20:00"
#         },
#         {
#             "name": "Lớp Database Design",
#             "max_students": 20,
#             "schedule": "Thứ 6, 7 - 14:00-17:00"
#         }
#     ]
#
#     created_classes = []
#     for class_data in sample_classes:
#         try:
#             db_class = ClassModel(**class_data)
#             db.add(db_class)
#             created_classes.append(class_data["name"])
#         except Exception as e:
#             print(f"Lỗi tạo lớp {class_data['name']}: {e}")
#
#     try:
#         db.commit()
#         return {"message": f"Đã tạo {len(created_classes)} lớp học mẫu", "classes": created_classes}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Lỗi khi tạo dữ liệu mẫu: {e}")