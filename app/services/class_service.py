from sqlalchemy.orm import Session
from app.models.class_model import Class
from app.models.registration import Registration
from app.models.history import ClassHistory

def check_schedule_conflict(db: Session, student_id: int, new_schedule: str) -> bool:
    regs = db.query(Registration).filter(Registration.student_id == student_id).all()
    for reg in regs:
        class_obj = db.query(Class).filter(Class.id == reg.class_id).first()
        if class_obj and class_obj.schedule == new_schedule:
            return True
    return False

def count_students_in_class(db: Session, class_id: int) -> int:
    return db.query(Registration).filter(Registration.class_id == class_id).count()

def get_class_histories(db: Session, class_id: int):
    return db.query(ClassHistory).filter(ClassHistory.class_id == class_id).all() 