from pydantic import BaseModel
from typing import Optional

class ClassBase(BaseModel):
    name: str
    max_students: Optional[int] = 30
    schedule: str

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: int
    course_id: int
    class Config:
        from_attributes = True 