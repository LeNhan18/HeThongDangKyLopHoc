# File: app/crud.py

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.class import Class
from app.models.course import Course
from app.models.registration import Registration
from app.models.history import ClassHistory
from app.schemas.user import UserCreate
from app.schemas.class import ClassCreate
from app.schemas.course import CourseCreate
from app.core.security import get_password_hash

# --- Các hàm CRUD đã có trước đó ---
# Bạn chỉ cần thêm các hàm mới vào cuối file.

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password, role=getattr(user, 'role', 'student'))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_course(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()

def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Course).offset(skip).limit(limit).all()

def create_course(db: Session, course: CourseCreate):
    db_course = Course(name=course.name, description=course.description)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def get_classes_by_course(db: Session, course_id: int, skip: int = 0, limit: int = 100):
    return db.query(Class).filter(Class.course_id == course_id).offset(skip).limit(limit).all()

def create_class_for_course(db: Session, class_data: ClassCreate, course_id: int):
    db_class = Class(**class_data.model_dump(), course_id=course_id)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

# --- THÊM CÁC HÀM MỚI VÀO ĐÂY ---
def check_schedule_conflict(db: Session, student_id: int, new_schedule: str) -> bool:
    # Lấy tất cả các lớp mà học viên đã đăng ký
    regs = db.query(Registration).filter(Registration.student_id == student_id).all()
    for reg in regs:
        class_obj = db.query(Class).filter(Class.id == reg.class_id).first()
        if class_obj and class_obj.schedule == new_schedule:
            return True  # Trùng lịch
    return False

def create_registration(db: Session, student_id: int, class_id: int):
    # Kiểm tra xem học viên đã đăng ký lớp này chưa
    db_registration = db.query(Registration).filter(
        Registration.student_id == student_id,
        Registration.class_id == class_id
    ).first()
    if db_registration:
        return None # Trả về None nếu đã tồn tại

    db_registration = Registration(student_id=student_id, class_id=class_id)
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    return db_registration

def get_registrations_for_class(db: Session, class_id: int):
    return db.query(Registration).filter(Registration.class_id == class_id).all()

def count_students_in_class(db: Session, class_id: int) -> int:
    return db.query(Registration).filter(Registration.class_id == class_id).count()

def get_class_by_id(db: Session, class_id: int):
    return db.query(Class).filter(Class.id == class_id).first()

def create_class_history(db: Session, class_id: int, changed_by: int, change_type: str, note: str = None):
    db_history = ClassHistory(class_id=class_id, changed_by=changed_by, change_type=change_type, note=note)
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_class_histories(db: Session, class_id: int):
    return db.query(ClassHistory).filter(ClassHistory.class_id == class_id).all()
