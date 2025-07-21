from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String(255), nullable=False)
    section_order = Column(Integer, default=1)  # Đổi tên cột
    lessons = relationship("Lesson", back_populates="section") 