from pydantic import BaseModel
from typing import Optional, List
from .class import Class

class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    classes: List[Class] = []
    class Config:
        from_attributes = True 