from pydantic import BaseModel
from typing import Optional, List, Any

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
    classes: List[Any] = []
    sections: List[Any] = []
    class Config:
        from_attributes = True 