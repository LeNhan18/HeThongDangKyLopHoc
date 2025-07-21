from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.section import Section as SectionModel
from app.schemas.section import Section as SectionSchema, SectionCreate

def create_section(db: Session, section: SectionCreate):
    db_section = SectionModel(**section.model_dump())
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return SectionSchema.model_validate(db_section)

def update_section(db: Session, section_id: int, section: SectionCreate):
    db_section = db.query(SectionModel).filter(SectionModel.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương")
    db_section.title = section.title  # type: ignore
    db_section.section_order = section.section_order  # type: ignore
    db.commit()
    db.refresh(db_section)
    return SectionSchema.model_validate(db_section)

def delete_section(db: Session, section_id: int):
    db_section = db.query(SectionModel).filter(SectionModel.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương")
    db.delete(db_section)
    db.commit()
    return {"message": "Đã xóa chương thành công"}

def get_section(db: Session, section_id: int):
    db_section = db.query(SectionModel).filter(SectionModel.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương")
    return SectionSchema.model_validate(db_section)

def get_sections_by_course(db: Session, course_id: int):
    sections = db.query(SectionModel).filter(SectionModel.course_id == course_id).order_by(SectionModel.section_order).all()
    return [SectionSchema.model_validate(s) for s in sections] 