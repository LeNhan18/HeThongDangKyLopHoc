from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from datetime import datetime
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    attended = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow) 