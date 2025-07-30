from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.attendance import Attendance
from app.models.class_model import Class as ClassModel
from app.models.course import Course as CourseModel
from app.models.feedback import Feedback
from app.models.history import ClassHistory
from app.schemas.class_schema import Class as ClassSchema, ClassCreate
from app.schemas.user import User
from app.CRUD import get_class_by_id, check_schedule_conflict, create_registration, create_class_history, count_students_in_class, get_class_histories
from app.models.registration import Registration

def get_all_classes(db: Session):
    db_classes = db.query(ClassModel).all()
    return [ClassSchema.model_validate(cls) for cls in db_classes]
def create_class(db: Session, class_data: ClassCreate, user: User):
    db_class = ClassModel(**class_data.model_dump())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return ClassSchema.model_validate(db_class)

def update_class(db: Session, class_id: int, class_data: ClassCreate, user: User):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
    
    # Lưu thông tin cũ để tạo lịch sử
    old_course_id = db_class.course_id
    old_name = db_class.name
    old_schedule = db_class.schedule
    
    # Cập nhật thông tin lớp học
    if class_data.name is not None:
        db_class.name = class_data.name
    if class_data.max_students is not None:
        db_class.max_students = class_data.max_students
    if class_data.schedule is not None:
        db_class.schedule = class_data.schedule
    if class_data.course_id is not None:
        # Kiểm tra khóa học tồn tại nếu được cung cấp
        if class_data.course_id != old_course_id:
            db_course = db.query(CourseModel).filter(CourseModel.id == class_data.course_id).first()
            if not db_course:
                raise HTTPException(status_code=404, detail="Không tìm thấy khóa học.")
            db_class.course_id = class_data.course_id
    
    db.commit()
    db.refresh(db_class)
    
    # Tạo lịch sử thay đổi nếu có thay đổi
    changes = []
    if class_data.name and class_data.name != old_name:
        changes.append(f"Tên lớp: {old_name} → {class_data.name}")
    if class_data.schedule and class_data.schedule != old_schedule:
        changes.append(f"Lịch học: {old_schedule} → {class_data.schedule}")
    if class_data.course_id and class_data.course_id != old_course_id:
        course_name = db_class.course.name if db_class.course else "Không xác định"
        changes.append(f"Khóa học: ID {old_course_id} → {course_name}")
    
    if changes:
        create_class_history(
            db, 
            class_id=class_id, 
            changed_by=user.id, 
            change_type="update_class", 
            note="; ".join(changes)
        )
    
    return ClassSchema.model_validate(db_class)

def delete_class(db: Session, class_id: int, user: User):
    """
    Xóa một lớp học và tất cả các bản ghi liên quan một cách an toàn.
    """
    # 1. Tìm lớp học cần xóa
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    # (Tùy chọn) Kiểm tra quyền của người dùng, ví dụ chỉ admin được xóa
    # if 'admin' not in [role.name for role in user.roles]:
    #     raise HTTPException(status_code=403, detail="Không có quyền thực hiện hành động này")

    # 2. Xóa tất cả các bản ghi phụ thuộc TRƯỚC KHI xóa lớp học
    # Dựa trên ERD của bạn, chúng ta cần xóa từ các bảng:
    # class_histories, registrations, attendances, feedbacks.
    # `synchronize_session=False` được khuyến nghị cho các thao tác xóa hàng loạt để có hiệu suất tốt hơn.

    # Xóa lịch sử lớp học (nguyên nhân gây ra lỗi của bạn)
    db.query(ClassHistory).filter(ClassHistory.class_id == class_id).delete(synchronize_session=False)

    # Xóa các lượt đăng ký
    db.query(Registration).filter(Registration.class_id == class_id).delete(synchronize_session=False)

    # Xóa các lượt điểm danh
    db.query(Attendance).filter(Attendance.class_id == class_id).delete(synchronize_session=False)

    # Xóa các phản hồi
    db.query(Feedback).filter(Feedback.class_id == class_id).delete(synchronize_session=False)

    # 3. Cuối cùng, xóa chính lớp học đó
    db.delete(db_class)

    # 4. Lưu tất cả các thay đổi vào CSDL
    db.commit()

    return {"message": f"Đã xóa thành công lớp học ID {class_id} và các dữ liệu liên quan."}



def register_class(db: Session, class_id: int, user: User):
    print("DEBUG user.roles:", user.roles)
    # Debug: In thông tin user hiện tại
    print(f"=== DEBUG REGISTRATION ===")
    print(f"User ID: {user.id}")
    print(f"User email/username: {getattr(user, 'email', 'N/A')}")
    print(f"User roles: {user.roles}")
    print(f"Class ID: {class_id}")

    # if not user.roles or "student" not in [r.lower() for r in user.roles]:
    #     raise HTTPException(status_code=403, detail="Chỉ học viên mới được đăng ký lớp.")

    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")

    # Debug: Kiểm tra tất cả registrations cho class này
    all_registrations = db.query(Registration).filter(
        Registration.class_id == class_id
    ).all()

    print(f"All registrations for class {class_id}:")
    for reg in all_registrations:
        print(f"  - Student ID: {reg.student_id}")

    # Kiểm tra xem đã đăng ký lớp này chưa
    existing_reg = db.query(Registration).filter(
        Registration.student_id == user.id,
        Registration.class_id == class_id
    ).first()

    print(f"Query: SELECT * FROM registrations WHERE student_id={user.id} AND class_id={class_id}")
    print(f"Existing registration found: {existing_reg is not None}")

    if existing_reg:
        print(f"Existing registration details:")
        print(f"  - ID: {existing_reg.id}")
        print(f"  - Student ID: {existing_reg.student_id}")
        print(f"  - Class ID: {existing_reg.class_id}")
        print(f"  - Created at: {getattr(existing_reg, 'created_at', 'N/A')}")
        raise HTTPException(status_code=400, detail=f"Bạn đã đăng ký lớp này rồi. User ID: {user.id}")

    try:
        # Tạo đăng ký mới
        db_registration = Registration(student_id=user.id, class_id=class_id)
        db.add(db_registration)
        db.commit()
        db.refresh(db_registration)

        print(f"Successfully created registration:")
        print(f"  - Registration ID: {db_registration.id}")
        print(f"  - Student ID: {db_registration.student_id}")
        print(f"  - Class ID: {db_registration.class_id}")

        create_class_history(db, class_id=class_id, changed_by=user.id, change_type="register", note="Đăng ký lớp")
        count = count_students_in_class(db, class_id)
        return {"message": "Đăng ký thành công", "current_count": count}
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi khi đăng ký: {str(e)}")
def change_class_schedule(db: Session, class_id: int, new_schedule: str, user: User):
    if not user.roles or not any(r.lower() in ["teacher", "admin"] for r in user.roles):
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được thay đổi lịch học.")
    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    old_schedule = class_obj.schedule
    class_obj.schedule = new_schedule  # type: ignore
    db.commit()
    create_class_history(db, class_id=class_id, changed_by=user.id, change_type="update_schedule", note=f"Đổi lịch từ {old_schedule} sang {new_schedule}")  # type: ignore
    return {"message": "Đã thay đổi lịch học", "old_schedule": old_schedule, "new_schedule": new_schedule}
def get_class_count(db: Session, class_id: int):
    count = count_students_in_class(db, class_id)
    return {"class_id": class_id, "current_count": count}

def get_class_history(db: Session, class_id: int, user: User):
    if not user.roles or not any(r.lower() in ["teacher", "admin"] for r in user.roles):
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được xem lịch sử thay đổi.")
    histories = get_class_histories(db, class_id)
    return histories

def assign_course_to_class(db: Session, class_id: int, course_id: int, user: User):
    """Gán khóa học vào lớp học"""
    # Kiểm tra quyền
    if not user.roles or not any(r.lower() in ["teacher", "admin"] for r in user.roles):
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được gán khóa học.")

    # Kiểm tra lớp học tồn tại
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")

    # Kiểm tra khóa học tồn tại
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học.")

    # Gán khóa học cho lớp học
    old_course_id = db_class.course_id
    db_class.course_id = course_id
    db.commit()

    # Tạo lịch sử thay đổi
    create_class_history(
        db,
        class_id=class_id,
        changed_by=user.id,
        change_type="assign_course",
        note=f"Gán khóa học {db_course.name} vào lớp học"
    )

    return {
        "message": f"Đã gán khóa học '{db_course.name}' vào lớp học '{db_class.name}'",
        "class_id": class_id,
        "course_id": course_id,
        "course_name": db_course.name,
        "old_course_id": old_course_id
    }

def remove_course_from_class(db: Session, class_id: int, user: User):
    """Xóa khóa học khỏi lớp học"""
    # Kiểm tra quyền
    if not user.roles or not any(r.lower() in ["teacher", "admin"] for r in user.roles):
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được xóa khóa học.")

    # Kiểm tra lớp học tồn tại
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")

    if not db_class.course_id:
        raise HTTPException(status_code=400, detail="Lớp học này chưa được gán khóa học nào.")

    # Lấy thông tin khóa học trước khi xóa
    course_name = db_class.course.name if db_class.course else "Không xác định"
    old_course_id = db_class.course_id

    # Xóa liên kết khóa học
    db_class.course_id = None
    db.commit()

    # Tạo lịch sử thay đổi
    create_class_history(
        db,
        class_id=class_id,
        changed_by=user.id,
        change_type="remove_course",
        note=f"Xóa khóa học {course_name} khỏi lớp học"
    )

    return {
        "message": f"Đã xóa khóa học '{course_name}' khỏi lớp học '{db_class.name}'",
        "class_id": class_id,
        "removed_course_id": old_course_id,
        "removed_course_name": course_name
    }

def get_class_course(db: Session, class_id: int):
    """Lấy thông tin khóa học của lớp học"""
    db_class = db.query(ClassModel).options(joinedload(ClassModel.course)).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")

    if not db_class.course:
        return {
            "class_id": class_id,
            "class_name": db_class.name,
            "course": None,
            "message": "Lớp học này chưa được gán khóa học nào."
        }

    return {
        "class_id": class_id,
        "class_name": db_class.name,
        "course": {
            "id": db_class.course.id,
            "name": db_class.course.name,
            "description": db_class.course.description,
            "image": db_class.course.image
        }
    }

def get_classes_by_course(db: Session, course_id: int):
    """Lấy tất cả lớp học của một khóa học"""
    # Kiểm tra khóa học tồn tại
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học.")
    
    # Lấy tất cả lớp học của khóa học này
    classes = db.query(ClassModel).filter(ClassModel.course_id == course_id).all()
    
    return {
        "course": {
            "id": db_course.id,
            "name": db_course.name,
            "description": db_course.description,
            "image": db_course.image
        },
        "classes": [
            {
                "id": cls.id,
                "name": cls.name,
                "max_students": cls.max_students,
                "schedule": cls.schedule,
                "current_students": count_students_in_class(db, cls.id)
            }
            for cls in classes
        ],
        "total_classes": len(classes)
    }

def get_class_students(db: Session, class_id: int):
    """Lấy danh sách học viên trong lớp học"""
    # Kiểm tra lớp học tồn tại
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    
    # Lấy danh sách đăng ký của lớp học
    from app.models.registration import Registration
    from app.models.user import User as UserModel
    
    registrations = db.query(Registration).filter(Registration.class_id == class_id).all()
    
    # Lấy thông tin học viên
    students = []
    for reg in registrations:
        student = db.query(UserModel).filter(UserModel.id == reg.student_id).first()
        if student:
            students.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "registration_date": reg.created_at.isoformat() if hasattr(reg, 'created_at') else None
            })
    
    return {
        "class": {
            "id": db_class.id,
            "name": db_class.name,
            "max_students": db_class.max_students,
            "schedule": db_class.schedule
        },
        "students": students,
        "total_students": len(students),
        "available_slots": db_class.max_students - len(students)
    }

def get_class_students_count(db: Session, class_id: int):
    """Lấy số lượng học viên trong lớp học"""
    # Kiểm tra lớp học tồn tại
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    
    # Đếm số học viên
    from app.models.registration import Registration
    student_count = db.query(Registration).filter(Registration.class_id == class_id).count()
    
    return {
        "class_id": class_id,
        "class_name": db_class.name,
        "current_students": student_count,
        "max_students": db_class.max_students,
        "available_slots": db_class.max_students - student_count,
        "occupancy_rate": round((student_count / db_class.max_students) * 100, 1) if db_class.max_students > 0 else 0
    } 