from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .course import Course

class ClassBase(BaseModel):
    name: str
    max_students: Optional[int] = 30
    schedule: str

class ClassCreate(ClassBase):
    course_id: Optional[int] = None

class Class(ClassBase):
    id: int
    course_id: Optional[int] = None
    course: Optional['Course'] = None
    class Config:
        from_attributes = True

# Rebuild model để resolve forward references
Class.model_rebuild() 