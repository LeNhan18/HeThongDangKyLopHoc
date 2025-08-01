from fastapi import APIRouter, Depends, HTTPException, status,Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.class_schema import Class as ClassSchema, ClassCreate, ClassBase
from app.schemas.user import User as UserSchema
from app.CRUD import *
from app.models.class_model import Class as ClassModel
from app.models.course import Course as CourseModel
from app.services import class_service
from app.api.endpoints_ws import send_notification_to_staff, send_notification_to_user
from app.models.user import User as UserModel
from app.core.auth import get_current_user_debug
from app.api.endpoints_ws import ws_manager

router = APIRouter()


@router.get("/classes/")
def get_all_classes(
    db: Session = Depends(get_db),
    user: UserSchema = Depends(get_current_user_debug)
):
    print(f"🔍 DEBUG get_all_classes: User ID = {user.id if user else 'None'}")
    return class_service.get_all_classes(db, user.id if user else None)

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

    result = class_service.register_class(db, class_id, current_user)
    # Gửi thông báo cho admin/teacher khi có đăng ký mới
    try:
        await send_notification_to_staff(
            notification_type="new_registration",
            message=f"Học viên {current_user.email} đã đăng ký lớp học mới",
            data={
                "class_id": class_id,
                "student_email": current_user.email,
                "student_name": current_user.name
            }
        )
    except Exception as e:
        print(f"Lỗi gửi thông báo: {e}")
    return result

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
async def change_class_schedule(class_id: int, new_schedule: str, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    result = class_service.change_class_schedule(db, class_id, new_schedule, user)
    
    # Gửi thông báo cho tất cả thành viên trong lớp
    try:
        # Lấy thông tin lớp học
        class_info = db.query(ClassModel).filter(ClassModel.id == class_id).first()
        if class_info:
            # Lấy danh sách học viên trong lớp
            from app.models.registration import Registration
            registrations = db.query(Registration).filter(Registration.class_id == class_id).all()
            
            # Gửi thông báo cho từng học viên
            for registration in registrations:
                await send_notification_to_user(
                    user_id=registration.student_id,
                    notification_type="schedule_change",
                    message=f"Lịch học lớp '{class_info.name}' đã được thay đổi từ '{result['old_schedule']}' sang '{result['new_schedule']}'",
                    data={
                        "class_id": class_id,
                        "class_name": class_info.name,
                        "old_schedule": result['old_schedule'],
                        "new_schedule": result['new_schedule'],
                        "changed_by": user.name or user.email
                    }
                )
            
            print(f"🔔 Đã gửi thông báo thay đổi lịch cho {len(registrations)} học viên")
        
    except Exception as e:
        print(f"Lỗi gửi thông báo thay đổi lịch: {e}")
    
    return result

@router.get("/class/{class_id}/history")
def get_class_history(class_id: int, db: Session = Depends(get_db), user: UserSchema = Depends(get_current_user_debug)):
    return class_service.get_class_history(db, class_id, user)

@router.post("/class/", response_model=ClassSchema)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    user: UserSchema = Depends(get_current_user_debug)
):
    # Lấy user_id từ user schema
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
@router.delete("/unregister_class/{class_id}")
async def unregister_class(class_id: int ,
                     db: Session =Depends(get_db),
                     current_user: UserSchema = Depends(get_current_user_debug)
                     ):
    """Hủy đăng ký lớp học"""
    print(f"🔍 DEBUG: Unregister endpoint called")
    print(f"🔍 DEBUG: Class ID: {class_id}")
    print(f"🔍 DEBUG: Current user: ID={current_user.id}, Email={current_user.email}")
    
    result = class_service.unregister_class(db, class_id, current_user)
    print(f"🔍 DEBUG: Unregister result: {result}")
    
    # Gửi thông báo cho admin/teacher khi có hủy đăng ký
    try:
        print(f"🔍 DEBUG: Sending notification...")
        await send_notification_to_staff(
            notification_type="unregister",
            message=f"Học viên {current_user.email} đã hủy đăng ký lớp '{result.get('class_name', 'N/A')}'",
            data={
                "class_id": class_id,
                "class_name": result.get('class_name'),
                "student_email": current_user.email,
                "student_name": current_user.name,
                "current_count": result.get('current_count')
            }
        )
        print(f"🔍 DEBUG: Notification sent successfully")
    except Exception as e:
        print(f"Lỗi gửi thông báo hủy đăng ký: {e}")
    
    return result