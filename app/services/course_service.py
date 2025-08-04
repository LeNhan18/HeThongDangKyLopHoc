from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Course as CourseModel
from app.schemas.course import Course as CourseSchema, CourseCreate, CourseUpdate
from app.services.section_service import get_sections_by_course
from app.services.lesson_service import get_lessons_by_section
from app.schemas.section import SectionWithLessons

def create_course(db: Session, course: CourseCreate):
    db_course = CourseModel(name=course.name, description=course.description)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return CourseSchema.model_validate(db_course).model_dump()

def update_course(db: Session, course_id: int, course: CourseUpdate):
    print("DEBUG update_course:", course)
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    
    # Chỉ cập nhật các trường được cung cấp
    if course.name is not None:
        db_course.name = course.name
    if course.description is not None:
        db_course.description = course.description
    if course.image is not None:
        db_course.image = course.image
    
    db.commit()
    db.refresh(db_course)
    return CourseSchema.model_validate(db_course).model_dump()

def delete_course(db: Session, course_id: int):
    print(f"DEBUG delete_course: course_id={course_id}")
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        print(f"DEBUG delete_course: Không tìm thấy khóa học với id={course_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    print(f"DEBUG delete_course: Đang xóa khóa học '{db_course.name}'")
    db.delete(db_course)
    db.commit()
    print(f"DEBUG delete_course: Đã xóa thành công")
    return {"message": "Đã xóa khóa học thành công"}

def get_course(db: Session, course_id: int):
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    course_data = CourseSchema.model_validate(db_course).model_dump()
    # Lấy danh sách sections
    sections = get_sections_by_course(db, course_id)
    section_with_lessons = []
    for section in sections:
        lessons = get_lessons_by_section(db, section.id)
        section_dict = section.model_dump()
        section_dict["lessons"] = lessons
        section_with_lessons.append(SectionWithLessons(**section_dict).model_dump())
    course_data["sections"] = section_with_lessons
    return course_data  # Trả về dictionary thay vì CourseSchema object

def get_courses(db: Session):
    courses = db.query(CourseModel).all()
    return [CourseSchema.model_validate(c).model_dump() for c in courses]
