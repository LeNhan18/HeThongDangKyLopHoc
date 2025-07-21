from pydantic import BaseModel
from typing import Optional

class LessonBase(BaseModel):
    section_id: int
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    lessons_order: Optional[int] = 1

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    id: int
    class Config:
        from_attributes = True 