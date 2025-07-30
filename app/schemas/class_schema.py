from pydantic import BaseModel
from typing import Optional, Any

class ClassBase(BaseModel):
    name: str
    max_students: Optional[int] = 30
    schedule: str

class ClassCreate(ClassBase):
    course_id: Optional[int] = None

class ClassUpdate(ClassBase):
    name: Optional[str] = None
    max_students: Optional[int] = None
    schedule: Optional[str] = None
    course_id: Optional[int] = None

class Class(ClassBase):
    id: int
    course_id: Optional[int] = None
    course: Optional[Any] = None
    class Config:
        from_attributes = True

class CourseAssignment(BaseModel):
    course_id: int

class CourseRemoval(BaseModel):
    confirm: bool = True 