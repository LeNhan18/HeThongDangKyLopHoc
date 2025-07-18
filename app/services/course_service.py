from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Course as CourseModel
from app.schemas.course import Course as CourseSchema, CourseCreate

def create_course(db: Session, course: CourseCreate):
    db_course = CourseModel(name=course.name, description=course.description)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return CourseSchema.model_validate(db_course)

def update_course(db: Session, course_id: int, course: CourseCreate):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db_course.name = course.name  # type: ignore
    db_course.description = course.description  # type: ignore
    db.commit()
    db.refresh(db_course)
    return CourseSchema.model_validate(db_course)

def delete_course(db: Session, course_id: int):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db.delete(db_course)
    db.commit()
    return {"message": "Đã xóa khóa học thành công"}

def get_course(db: Session, course_id: int):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    return CourseSchema.model_validate(db_course)

def get_courses(db: Session):
    courses = db.query(CourseModel).all()
    return [CourseSchema.model_validate(c) for c in courses] 