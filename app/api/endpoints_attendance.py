from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import json

from app.database import get_db
from app.core.attendance_auth import get_current_user
from app.models.user import User
from app.models.class_model import Class
from app.models.registration import Registration
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    BulkAttendanceCreate, AttendanceStats, AttendanceHistoryFilter,
    ClassSessionCreate, ClassSessionUpdate, ClassSessionResponse,
    JoinClassRequest
)
from app.services.attendance_service import AttendanceCRUD, ClassSessionCRUD

router = APIRouter(prefix="/api/classes", tags=["Attendance"])

def has_admin_or_instructor_role(user: User) -> bool:
    """Helper function to check if user has admin or instructor role"""
    if not user or not user.roles:
        return False
    
    # user.roles có thể là list string hoặc list Role objects
    if isinstance(user.roles[0], str):
        user_role_names = [role.lower() for role in user.roles]
    else:
        user_role_names = [role.name.lower() for role in user.roles]
    
    return any(role in ["admin", "instructor", "teacher"] for role in user_role_names)

def has_student_role(user: User) -> bool:
    """Helper function to check if user has student role"""
    if not user or not user.roles:
        return False
    
    # user.roles có thể là list string hoặc list Role objects  
    if isinstance(user.roles[0], str):
        user_role_names = [role.lower() for role in user.roles]
    else:
        user_role_names = [role.name.lower() for role in user.roles]
    
    return "student" in user_role_names

@router.get("/{class_id}")
async def get_class_info(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin lớp học"""
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền truy cập
    if not has_admin_or_instructor_role(current_user):
        # Kiểm tra xem user có đăng ký lớp này không
        registration = db.query(Registration).filter(
            Registration.class_id == class_id,
            Registration.user_id == current_user.id
        ).first()
        if not registration:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": class_info.id,
        "name": class_info.class_name,
        "instructor": getattr(class_info.instructor, 'full_name', 'Unknown') if class_info.instructor else 'Unknown',
        "schedule": class_info.schedule,
        "room": class_info.room or "Online",
        "course_name": getattr(class_info.course, 'course_name', 'Unknown') if class_info.course else 'Unknown'
    }

@router.get("/{class_id}/students")
async def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách học viên trong lớp"""
    # Kiểm tra lớp học có tồn tại
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền truy cập
    if not has_admin_or_instructor_role(current_user):
        registration = db.query(Registration).filter(
            Registration.class_id == class_id,
            Registration.user_id == current_user.id
        ).first()
        if not registration:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Lấy danh sách học viên đã đăng ký
    from app.models.user import User as UserModel
    
    registrations = db.query(Registration).filter(
        Registration.class_id == class_id
    ).all()
    
    print(f"🔍 DEBUG: Found {len(registrations)} registrations for class {class_id}")
    
    students = []
    for reg in registrations:
        # Lấy user thông qua student_id
        user = db.query(UserModel).filter(UserModel.id == reg.student_id).first()
        if user:
            students.append({
                "user_id": user.id,
                "id": user.id,
                "name": user.name or f"Học viên {user.id}",
                "full_name": user.name or f"Học viên {user.id}",
                "email": user.email,
                "attendance_status": "pending"  # default status
            })
            print(f"🔍 DEBUG: Added student {user.name} ({user.email})")
    
    # Nếu không có registrations, tạo mock data để test
    if len(students) == 0:
        print(f"🔍 DEBUG: No registrations found, creating mock students")
        # Lấy một vài users từ database để làm mock data
        all_users = db.query(UserModel).limit(3).all()
        for user in all_users:
            students.append({
                "user_id": user.id,
                "id": user.id,
                "name": user.name or f"Học viên {user.id}",
                "full_name": user.name or f"Học viên {user.id}",
                "email": user.email,
                "attendance_status": "pending"
            })
            print(f"🔍 DEBUG: Added mock student {user.name} ({user.email})")
    
    return students

@router.post("/{class_id}/attendance")
async def mark_attendance(
    class_id: int,
    attendance_data: BulkAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lưu điểm danh hàng loạt - cho instructor/admin"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền (chỉ instructor hoặc admin mới có thể điểm danh cho học viên khác)
    if not has_admin_or_instructor_role(current_user):
        raise HTTPException(status_code=403, detail="Only instructors can mark attendance")
    
    try:
        # Cập nhật class_id trong data
        attendance_data.class_id = class_id
        
        # Xóa điểm danh cũ của ngày hiện tại (nếu có)
        existing_attendances = AttendanceCRUD.get_class_attendance_by_date(
            db, class_id, attendance_data.date.date()
        )
        for existing in existing_attendances:
            db.delete(existing)
        db.commit()
        
        # Tạo điểm danh mới
        attendance_records = AttendanceCRUD.bulk_create_attendance(
            db, attendance_data, marked_by=current_user.id
        )
        
        return attendance_records
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{class_id}/self-attendance")
async def mark_self_attendance(
    class_id: int,
    attendance_data: BulkAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cho phép học viên tự điểm danh"""
    print(f"🔍 DEBUG: Student self-attendance - User: {current_user.id}, Class: {class_id}")
    
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra học viên có đăng ký lớp này không
    registration = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.class_id == class_id
    ).first()
    
    if not registration and not has_admin_or_instructor_role(current_user):
        raise HTTPException(status_code=403, detail="You are not registered for this class")
    
    try:
        # Debug: In ra cấu trúc dữ liệu
        print(f"🔍 DEBUG: attendance_data.attendance: {attendance_data.attendance}")
        print(f"🔍 DEBUG: First attendance item: {attendance_data.attendance[0]}")
        
        # Đảm bảo chỉ điểm danh cho chính mình
        first_attendance = attendance_data.attendance[0]
        student_id_in_request = first_attendance.student_id if hasattr(first_attendance, 'student_id') else first_attendance.get('student_id')
        
        if len(attendance_data.attendance) != 1 or student_id_in_request != current_user.id:
            raise HTTPException(status_code=400, detail="You can only mark attendance for yourself")
        
        # Cập nhật class_id trong data
        attendance_data.class_id = class_id
        
        # Xóa điểm danh cũ của học viên trong ngày hiện tại (nếu có)
        existing_attendance = AttendanceCRUD.get_student_attendance_by_date(
            db, class_id, current_user.id, attendance_data.date.date()
        )
        if existing_attendance:
            db.delete(existing_attendance)
            db.commit()
        
        # Tạo điểm danh mới - trực tiếp thay vì dùng bulk_create
        from app.models.attendance import Attendance, AttendanceStatus
        
        first_attendance = attendance_data.attendance[0]
        status_str = first_attendance.get('status', 'present')
        
        # Tạo attendance record trực tiếp - đúng enum value
        new_attendance = Attendance(
            class_id=class_id,
            student_id=current_user.id,
            date=attendance_data.date,
            status=AttendanceStatus(status_str.lower()),  # Chuyển về lowercase
            marked_by=current_user.id,
            attended=(status_str.lower() == 'present')
        )
        
        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)
        
        print(f"🔍 DEBUG: Self-attendance created successfully: {new_attendance.id}")
        return [new_attendance]
        
    except Exception as e:
        print(f"🔍 DEBUG: Error in self-attendance: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{class_id}/attendance/history", response_model=List[AttendanceResponse])
async def get_attendance_history(
    class_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy lịch sử điểm danh"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền truy cập
    if not has_admin_or_instructor_role(current_user):
        registration = db.query(Registration).filter(
            Registration.class_id == class_id,
            Registration.user_id == current_user.id
        ).first()
        if not registration:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Tạo filter
    filters = AttendanceHistoryFilter(
        start_date=start_date,
        end_date=end_date,
        student_id=student_id,
        status=status
    )
    
    # Lấy lịch sử điểm danh
    attendance_history = AttendanceCRUD.get_class_attendance_history(db, class_id, filters)
    
    return attendance_history

@router.get("/{class_id}/attendance/stats", response_model=AttendanceStats)
async def get_attendance_stats(
    class_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy thống kê điểm danh"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền truy cập
    if not has_admin_or_instructor_role(current_user):
        registration = db.query(Registration).filter(
            Registration.class_id == class_id,
            Registration.user_id == current_user.id
        ).first()
        if not registration:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Lấy thống kê
    stats = AttendanceCRUD.get_attendance_stats(db, class_id, start_date, end_date)
    
    return AttendanceStats(**stats)

@router.post("/{class_id}/join", response_model=AttendanceResponse)
async def join_class(
    class_id: int,
    join_data: JoinClassRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ghi nhận học viên tham gia lớp học"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền (học viên chỉ có thể join cho chính mình)
    if has_student_role(current_user) and join_data.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Students can only join for themselves")
    
    # Kiểm tra đăng ký
    registration = db.query(Registration).filter(
        Registration.class_id == class_id,
        Registration.user_id == join_data.student_id
    ).first()
    if not registration:
        raise HTTPException(status_code=403, detail="Student not registered for this class")
    
    try:
        # Ghi nhận tham gia
        attendance = AttendanceCRUD.mark_student_join_class(
            db, 
            class_id, 
            join_data.student_id,
            join_data.join_time or datetime.now(),
            join_data.device_info
        )
        
        return attendance
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{class_id}/attendance/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    class_id: int,
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật thông tin điểm danh"""
    # Kiểm tra quyền (chỉ instructor hoặc admin)
    if not has_admin_or_instructor_role(current_user):
        raise HTTPException(status_code=403, detail="Only instructors can update attendance")
    
    # Kiểm tra điểm danh có tồn tại
    attendance = AttendanceCRUD.get_attendance_by_id(db, attendance_id)
    if not attendance or attendance.class_id != class_id:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Cập nhật
    updated_attendance = AttendanceCRUD.update_attendance(db, attendance_id, attendance_update)
    if not updated_attendance:
        raise HTTPException(status_code=400, detail="Failed to update attendance")
    
    return updated_attendance

# Class Session endpoints
@router.post("/{class_id}/sessions")
async def create_class_session(
    class_id: int,
    session_data: ClassSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo phiên học mới"""
    # Kiểm tra quyền
    if not has_admin_or_instructor_role(current_user):
        raise HTTPException(status_code=403, detail="Only instructors can create sessions")
    
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Tắt các phiên học khác
    ClassSessionCRUD.deactivate_all_sessions(db, class_id)
    
    # Tạo phiên học mới
    session_data.class_id = class_id
    session = ClassSessionCRUD.create_session(db, session_data)
    
    return session

@router.get("/{class_id}/sessions", response_model=List[ClassSessionResponse])
async def get_class_sessions(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách phiên học"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Kiểm tra quyền truy cập
    if not has_admin_or_instructor_role(current_user):
        registration = db.query(Registration).filter(
            Registration.class_id == class_id,
            Registration.user_id == current_user.id
        ).first()
        if not registration:
            raise HTTPException(status_code=403, detail="Access denied")
    
    sessions = ClassSessionCRUD.get_class_sessions(db, class_id)
    return sessions

@router.get("/{class_id}/sessions/active", response_model=Optional[ClassSessionResponse])
async def get_active_session(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy phiên học đang hoạt động"""
    # Kiểm tra lớp học
    class_info = db.query(Class).filter(Class.id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    active_session = ClassSessionCRUD.get_active_session(db, class_id)
    return active_session
