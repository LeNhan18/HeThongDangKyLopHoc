from pydantic import BaseModel
from typing import Optional

class SectionBase(BaseModel):
    course_id: int
    title: str
    section_order: Optional[int] = 1  # Đổi tên trường

class SectionCreate(SectionBase):
    pass

class Section(SectionBase):
    id: int
    class Config:
        from_attributes = True 