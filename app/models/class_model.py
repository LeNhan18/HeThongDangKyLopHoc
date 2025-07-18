from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    max_students = Column(Integer, default=30)
    course_id = Column(Integer, ForeignKey("courses.id"))
    schedule = Column(String(255), nullable=False)
    course = relationship("Course", back_populates="classes") 