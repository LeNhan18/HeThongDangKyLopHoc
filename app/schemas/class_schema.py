from pydantic import BaseModel
from typing import Optional, Any, List, Dict

class ClassBase(BaseModel):
    name: str
    max_students: Optional[int] = 30
    schedule: List[Dict]

class ClassCreate(ClassBase):
    course_id: Optional[int] = None

class ClassUpdate(ClassBase):
    name: Optional[str] = None
    max_students: Optional[int] = None
    schedule: Optional[List[Dict]] = None
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
class ClassSchema(BaseModel):
    id: int
    name: str
    max_students: int
    current_count: int
    is_registered: bool = False
