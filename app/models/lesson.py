from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"))
    title = Column(String(255), nullable=False)
    content = Column(Text)
    video_url = Column(String(500))
    lessons_order = Column(Integer, default=1)
    section = relationship("Section", back_populates="lessons") 