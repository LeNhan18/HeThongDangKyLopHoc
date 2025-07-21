from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.lesson import Lesson, LessonCreate
from app.services import lesson_service

router = APIRouter()

@router.post("/lessons/", response_model=Lesson)
def create_lesson(lesson: LessonCreate, db: Session = Depends(get_db)):
    return lesson_service.create_lesson(db, lesson)

@router.get("/lessons/{lesson_id}", response_model=Lesson)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return lesson_service.get_lesson(db, lesson_id)

@router.get("/sections/{section_id}/lessons", response_model=list[Lesson])
def get_lessons_by_section(section_id: int, db: Session = Depends(get_db)):
    return lesson_service.get_lessons_by_section(db, section_id)

@router.put("/lessons/{lesson_id}", response_model=Lesson)
def update_lesson(lesson_id: int, lesson: LessonCreate, db: Session = Depends(get_db)):
    return lesson_service.update_lesson(db, lesson_id, lesson)

@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return lesson_service.delete_lesson(db, lesson_id) 