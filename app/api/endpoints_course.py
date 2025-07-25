from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.course import Course, CourseCreate
from app.services import course_service
from app.models.course import Course as CourseModel
from app.schemas.user import User
from app.core.auth import get_current_user

router = APIRouter()

def require_roles(required_roles: list[str]):
    def checker(user: User = Depends(get_current_user)):
        if not any(r.lower() in [role.lower() for role in user.roles] for r in required_roles):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này.")
        return user
    return checker

@router.post("/courses/", response_model=Course)
def create_new_course(course: CourseCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return course_service.create_course(db, course)

@router.get("/courses/", response_model=list[Course])
def list_courses(db: Session = Depends(get_db)):
    return course_service.get_courses(db)

@router.get("/courses/{course_id}", response_model=Course)
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    course = course_service.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    return course

@router.put("/courses/{course_id}", response_model=Course)
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db_course.name = course.name
    db_course.description = course.description
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    db.delete(db_course)
    db.commit()
    return {"message": "Đã xóa khóa học thành công"}
