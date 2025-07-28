from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.class_model import Class as ClassModel
from app.schemas.class_schema import Class as ClassSchema, ClassCreate
from app.schemas.user import User
from app.CRUD import get_class_by_id, check_schedule_conflict, create_registration, create_class_history, count_students_in_class, get_class_histories

def get_all_classes(db: Session):
    """Lấy tất cả lớp học"""
    classes = db.query(ClassModel).options(joinedload(ClassModel.course)).all()
    return [ClassSchema.model_validate(cls) for cls in classes]

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
    db_class.name = class_data.name  # type: ignore
    db_class.max_students = class_data.max_students  # type: ignore
    db_class.schedule = class_data.schedule  # type: ignore
    db.commit()
    db.refresh(db_class)
    return ClassSchema.model_validate(db_class)

def delete_class(db: Session, class_id: int, user: User):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
    db.delete(db_class)
    db.commit()
    return {"message": "Đã xóa lớp học thành công"}

def register_class(db: Session, class_id: int, user: User):
    if not user.roles or "student" not in [r.lower() for r in user.roles]:
        raise HTTPException(status_code=403, detail="Chỉ học viên mới được đăng ký lớp.")
    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if check_schedule_conflict(db, user.id, class_obj.schedule):  # type: ignore
        raise HTTPException(status_code=400, detail="Bạn đã đăng ký lớp khác trùng lịch.")
    reg = create_registration(db, user.id, class_id)  # type: ignore
    if not reg:
        raise HTTPException(status_code=400, detail="Đã đăng ký lớp này rồi.")
    create_class_history(db, class_id=class_id, changed_by=user.id, change_type="register", note="Đăng ký lớp")  # type: ignore
    count = count_students_in_class(db, class_id)
    return {"message": "Đăng ký thành công", "current_count": count}

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