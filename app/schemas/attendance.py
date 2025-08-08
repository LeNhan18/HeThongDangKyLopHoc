from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class AttendanceStatusEnum(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"

class AttendanceBase(BaseModel):
    class_id: int
    student_id: int
    date: datetime
    status: AttendanceStatusEnum = AttendanceStatusEnum.ABSENT
    join_time: Optional[datetime] = None
    leave_time: Optional[datetime] = None
    device_info: Optional[str] = None
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatusEnum] = None
    join_time: Optional[datetime] = None
    leave_time: Optional[datetime] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    marked_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BulkAttendanceCreate(BaseModel):
    class_id: int
    date: datetime
    attendance: List[dict] = Field(..., description="List of {student_id: int, status: str}")

class AttendanceStats(BaseModel):
    total_students: int
    present: int
    absent: int
    late: int
    excused: int
    attendance_rate: float

class ClassSessionBase(BaseModel):
    class_id: int
    session_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    lesson_topic: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = False
    virtual_room_id: Optional[str] = None

class ClassSessionCreate(ClassSessionBase):
    pass

class ClassSessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    lesson_topic: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    virtual_room_id: Optional[str] = None

class ClassSessionResponse(ClassSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class JoinClassRequest(BaseModel):
    student_id: int
    join_time: Optional[datetime] = None
    device_info: Optional[str] = None

class AttendanceHistoryFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    student_id: Optional[int] = None
    status: Optional[AttendanceStatusEnum] = None

class AttendanceReportCreate(BaseModel):
    class_id: int
    report_type: str = Field(..., pattern="^(daily|weekly|monthly)$")
    start_date: datetime
    end_date: datetime

class AttendanceReportResponse(BaseModel):
    id: int
    class_id: int
    report_type: str
    start_date: datetime
    end_date: datetime
    total_students: int
    total_sessions: int
    attendance_rate: Optional[str] = None
    file_path: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
