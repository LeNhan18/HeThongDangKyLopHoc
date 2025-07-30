from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.services import course_service
from app.models.course import Course as CourseModel
from app.schemas.user import User
from app.core.auth import get_current_user_debug
from app.core.permissions import require_roles

router = APIRouter()

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
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return course_service.update_course(db, course_id, course)

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(["admin", "teacher"]))):
    return course_service.delete_course(db, course_id)

@router.post("/courses/sample-data")
def create_sample_courses(db: Session = Depends(get_db)):
    """Tạo dữ liệu mẫu cho khóa học"""
    sample_courses = [
        {
            "name": "Python Programming",
            "description": "Khóa học lập trình Python từ cơ bản đến nâng cao"
        },
        {
            "name": "React Development",
            "description": "Khóa học phát triển ứng dụng web với React"
        },
        {
            "name": "Database Design",
            "description": "Khóa học thiết kế và quản lý cơ sở dữ liệu"
        }
    ]
    
    created_courses = []
    for course_data in sample_courses:
        try:
            db_course = CourseModel(**course_data)
            db.add(db_course)
            created_courses.append(course_data["name"])
        except Exception as e:
            print(f"Lỗi tạo khóa học {course_data['name']}: {e}")
    
    try:
        db.commit()
        return {"message": f"Đã tạo {len(created_courses)} khóa học mẫu", "courses": created_courses}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo dữ liệu mẫu: {e}")
