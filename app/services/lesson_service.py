from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.lesson import Lesson as LessonModel
from app.schemas.lesson import Lesson as LessonSchema, LessonCreate

def create_lesson(db: Session, lesson: LessonCreate):
    db_lesson = LessonModel(**lesson.model_dump())
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return LessonSchema.model_validate(db_lesson)

def update_lesson(db: Session, lesson_id: int, lesson: LessonCreate):
    db_lesson = db.query(LessonModel).filter(LessonModel.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    db_lesson.title = lesson.title  # type: ignore
    db_lesson.content = lesson.content  # type: ignore
    db_lesson.video_url = lesson.video_url  # type: ignore
    db_lesson.lessons_order = lesson.lessons_order  # type: ignore
    db.commit()
    db.refresh(db_lesson)
    return LessonSchema.model_validate(db_lesson)

def delete_lesson(db: Session, lesson_id: int):
    db_lesson = db.query(LessonModel).filter(LessonModel.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    db.delete(db_lesson)
    db.commit()
    return {"message": "Đã xóa bài học thành công"}

def get_lesson(db: Session, lesson_id: int):
    db_lesson = db.query(LessonModel).filter(LessonModel.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    return LessonSchema.model_validate(db_lesson)

def get_lessons_by_section(db: Session, section_id: int):
    lessons = db.query(LessonModel).filter(LessonModel.section_id == section_id).order_by(LessonModel.lessons_order).all()
    return [LessonSchema.model_validate(l) for l in lessons] 