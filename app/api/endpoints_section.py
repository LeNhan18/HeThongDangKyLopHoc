from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.section import Section, SectionCreate
from app.services import section_service

router = APIRouter()

@router.post("/sections/", response_model=Section)
def create_section(section: SectionCreate, db: Session = Depends(get_db)):
    return section_service.create_section(db, section)

@router.get("/sections/{section_id}", response_model=Section)
def get_section(section_id: int, db: Session = Depends(get_db)):
    return section_service.get_section(db, section_id)

@router.get("/courses/{course_id}/sections", response_model=list[Section])
def get_sections_by_course(course_id: int, db: Session = Depends(get_db)):
    return section_service.get_sections_by_course(db, course_id)

@router.put("/sections/{section_id}", response_model=Section)
def update_section(section_id: int, section: SectionCreate, db: Session = Depends(get_db)):
    return section_service.update_section(db, section_id, section)

@router.delete("/sections/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db)):
    return section_service.delete_section(db, section_id) 