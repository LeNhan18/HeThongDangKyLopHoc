from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.course import Course, CourseCreate
from app.CRUD import create_course, get_courses, get_course
from app.models.course import Course as CourseModel

router = APIRouter()

@router.post("/courses/", response_model=Course)
def create_new_course(course: CourseCreate, db: Session = Depends(get_db)):
    return create_course(db, course)

@router.get("/courses/", response_model=list[Course])
def list_courses(db: Session = Depends(get_db)):
    return get_courses(db)

@router.get("/courses/{course_id}", response_model=Course)
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    return course

@router.put("/courses/{course_id}", response_model=Course)
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db_course.name = course.name
    db_course.description = course.description
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db.delete(db_course)
    db.commit()
    return {"message": "Đã xóa khóa học thành công"} 