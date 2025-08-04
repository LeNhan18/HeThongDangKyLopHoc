from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class AttendanceStatus(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent" 
    LATE = "late"
    EXCUSED = "excused"

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.ABSENT)
    join_time = Column(DateTime, nullable=True)
    leave_time = Column(DateTime, nullable=True)
    device_info = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Legacy field for backward compatibility
    attended = Column(Boolean, default=False)

class ClassSession(Base):
    __tablename__ = "class_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    session_date = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    lesson_topic = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    virtual_room_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AttendanceReport(Base):
    __tablename__ = "attendance_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    report_type = Column(String(50), nullable=False)  # daily, weekly, monthly
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    total_students = Column(Integer, nullable=False)
    total_sessions = Column(Integer, nullable=False)
    attendance_rate = Column(String(10), nullable=True)  # percentage
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now()) 