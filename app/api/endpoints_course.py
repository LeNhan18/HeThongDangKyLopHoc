from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.course import Course, CourseCreate, CourseUpdate  # Pydantic schemas
from app.services import course_service
from app.models.course import Course as CourseModel  # SQLAlchemy model
from app.schemas.user import User
from app.core.auth import get_current_user_debug
from app.core.permissions import require_roles

router = APIRouter()

@router.post("/courses/")
def create_course(course: CourseCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    """Create a new course"""
    return course_service.create_course(db, course)

@router.get("/courses/")
def list_courses(db: Session = Depends(get_db)):
    """Get all courses"""
    courses = course_service.get_courses(db)
    return courses

@router.get("/courses/{course_id}")
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    """Get course by ID"""
    course = course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.put("/courses/{course_id}")
def update_course(
    course_id: int, 
    course: CourseUpdate, 
    db: Session = Depends(get_db), 
    user: User = Depends(require_roles(["admin", "teacher"]))
):
    """Update a course"""
    updated_course = course_service.update_course(db, course_id, course)
    if not updated_course:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated_course

@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int, 
    db: Session = Depends(get_db), 
    user: User = Depends(require_roles(["admin", "teacher"]))
):
    """Delete a course"""
    success = course_service.delete_course(db, course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}
