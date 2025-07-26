from pydantic import BaseModel
from typing import Optional, List
from .class_schema import Class
from .section import SectionWithLessons

class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    image :Optional[str] =None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None

class Course(CourseBase):
    id: int
    classes: List[Class] = []
    sections: List[SectionWithLessons] = []
    class Config:
        from_attributes = True 