from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.course import Course, CourseCreate
from app.CRUD import create_course, get_courses, get_course

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