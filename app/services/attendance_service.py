from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from datetime import datetime, date
from typing import List, Optional
from app.models.attendance import Attendance, ClassSession, AttendanceReport, AttendanceStatus
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, BulkAttendanceCreate,
    ClassSessionCreate, ClassSessionUpdate, AttendanceHistoryFilter
)

class AttendanceCRUD:
    
    @staticmethod
    def create_attendance(db: Session, attendance: AttendanceCreate, marked_by: int = None) -> Attendance:
        """Tạo bản ghi điểm danh mới"""
        db_attendance = Attendance(
            class_id=attendance.class_id,
            student_id=attendance.student_id,
            date=attendance.date,
            status=attendance.status,
            join_time=attendance.join_time,
            leave_time=attendance.leave_time,
            device_info=attendance.device_info,
            notes=attendance.notes,
            marked_by=marked_by,
            attended=attendance.status.value == "present"  # For backward compatibility
        )
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        return db_attendance
    
    @staticmethod
    def get_attendance_by_id(db: Session, attendance_id: int) -> Optional[Attendance]:
        """Lấy thông tin điểm danh theo ID"""
        return db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    @staticmethod
    def get_class_attendance_by_date(db: Session, class_id: int, date: date) -> List[Attendance]:
        """Lấy điểm danh của lớp theo ngày"""
        return db.query(Attendance).filter(
            and_(
                Attendance.class_id == class_id,
                func.date(Attendance.date) == date
            )
        ).all()
    
    @staticmethod
    def get_student_attendance_by_date(db: Session, class_id: int, student_id: int, date: date) -> Optional[Attendance]:
        """Lấy điểm danh của học viên theo ngày trong lớp"""
        return db.query(Attendance).filter(
            and_(
                Attendance.class_id == class_id,
                Attendance.student_id == student_id,
                func.date(Attendance.date) == date
            )
        ).first()
    
    @staticmethod
    def get_student_attendance_history(db: Session, student_id: int, class_id: int = None) -> List[Attendance]:
        """Lấy lịch sử điểm danh của học viên"""
        query = db.query(Attendance).filter(Attendance.student_id == student_id)
        if class_id:
            query = query.filter(Attendance.class_id == class_id)
        return query.order_by(desc(Attendance.date)).all()
    
    @staticmethod
    def get_class_attendance_history(db: Session, class_id: int, filters: AttendanceHistoryFilter = None) -> List[Attendance]:
        """Lấy lịch sử điểm danh của lớp với bộ lọc"""
        query = db.query(Attendance).filter(Attendance.class_id == class_id)
        
        if filters:
            if filters.start_date:
                query = query.filter(Attendance.date >= filters.start_date)
            if filters.end_date:
                query = query.filter(Attendance.date <= filters.end_date)
            if filters.student_id:
                query = query.filter(Attendance.student_id == filters.student_id)
            if filters.status:
                query = query.filter(Attendance.status == filters.status)
                
        return query.order_by(desc(Attendance.date)).all()
    
    @staticmethod
    def update_attendance(db: Session, attendance_id: int, attendance_update: AttendanceUpdate) -> Optional[Attendance]:
        """Cập nhật thông tin điểm danh"""
        db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not db_attendance:
            return None
            
        update_data = attendance_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_attendance, field, value)
            
        # Update legacy field
        if "status" in update_data:
            db_attendance.attended = update_data["status"] == "present"
            
        db.commit()
        db.refresh(db_attendance)
        return db_attendance
    
    @staticmethod
    def bulk_create_attendance(db: Session, bulk_data: BulkAttendanceCreate, marked_by: int = None) -> List[Attendance]:
        """Tạo điểm danh hàng loạt"""
        attendance_records = []
        
        for attendance_item in bulk_data.attendance:
            db_attendance = Attendance(
                class_id=bulk_data.class_id,
                student_id=attendance_item["student_id"],
                date=bulk_data.date,
                status=AttendanceStatus(attendance_item["status"]),
                marked_by=marked_by,
                attended=attendance_item["status"] == "present"
            )
            attendance_records.append(db_attendance)
            
        db.add_all(attendance_records)
        db.commit()
        
        for record in attendance_records:
            db.refresh(record)
            
        return attendance_records
    
    @staticmethod
    def get_attendance_stats(db: Session, class_id: int, start_date: date = None, end_date: date = None) -> dict:
        """Thống kê điểm danh"""
        query = db.query(Attendance).filter(Attendance.class_id == class_id)
        
        if start_date:
            query = query.filter(func.date(Attendance.date) >= start_date)
        if end_date:
            query = query.filter(func.date(Attendance.date) <= end_date)
            
        attendances = query.all()
        
        total = len(attendances)
        if total == 0:
            return {
                "total_students": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
                "excused": 0,
                "attendance_rate": 0.0
            }
        
        present = len([a for a in attendances if a.status == AttendanceStatus.PRESENT])
        absent = len([a for a in attendances if a.status == AttendanceStatus.ABSENT])
        late = len([a for a in attendances if a.status == AttendanceStatus.LATE])
        excused = len([a for a in attendances if a.status == AttendanceStatus.EXCUSED])
        
        attendance_rate = (present + late) / total * 100 if total > 0 else 0
        
        return {
            "total_students": total,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "attendance_rate": round(attendance_rate, 2)
        }
    
    @staticmethod
    def mark_student_join_class(db: Session, class_id: int, student_id: int, join_time: datetime = None, device_info: str = None) -> Attendance:
        """Ghi nhận học viên tham gia lớp học"""
        today = datetime.now().date()
        
        # Tìm bản ghi điểm danh hiện tại
        existing_attendance = db.query(Attendance).filter(
            and_(
                Attendance.class_id == class_id,
                Attendance.student_id == student_id,
                func.date(Attendance.date) == today
            )
        ).first()
        
        if existing_attendance:
            # Cập nhật thời gian tham gia
            existing_attendance.join_time = join_time or datetime.now()
            existing_attendance.device_info = device_info
            if existing_attendance.status == AttendanceStatus.ABSENT:
                existing_attendance.status = AttendanceStatus.PRESENT
                existing_attendance.attended = True
        else:
            # Tạo bản ghi mới
            existing_attendance = Attendance(
                class_id=class_id,
                student_id=student_id,
                date=datetime.now(),
                status=AttendanceStatus.PRESENT,
                join_time=join_time or datetime.now(),
                device_info=device_info,
                attended=True
            )
            db.add(existing_attendance)
            
        db.commit()
        db.refresh(existing_attendance)
        return existing_attendance

class ClassSessionCRUD:
    
    @staticmethod
    def create_session(db: Session, session: ClassSessionCreate) -> ClassSession:
        """Tạo phiên học mới"""
        db_session = ClassSession(**session.dict())
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def get_session_by_id(db: Session, session_id: int) -> Optional[ClassSession]:
        """Lấy thông tin phiên học theo ID"""
        return db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    @staticmethod
    def get_class_sessions(db: Session, class_id: int) -> List[ClassSession]:
        """Lấy danh sách phiên học của lớp"""
        return db.query(ClassSession).filter(ClassSession.class_id == class_id).order_by(desc(ClassSession.session_date)).all()
    
    @staticmethod
    def get_active_session(db: Session, class_id: int) -> Optional[ClassSession]:
        """Lấy phiên học đang hoạt động"""
        return db.query(ClassSession).filter(
            and_(
                ClassSession.class_id == class_id,
                ClassSession.is_active == True
            )
        ).first()
    
    @staticmethod
    def update_session(db: Session, session_id: int, session_update: ClassSessionUpdate) -> Optional[ClassSession]:
        """Cập nhật thông tin phiên học"""
        db_session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not db_session:
            return None
            
        update_data = session_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_session, field, value)
            
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def deactivate_all_sessions(db: Session, class_id: int):
        """Tắt tất cả phiên học của lớp"""
        db.query(ClassSession).filter(ClassSession.class_id == class_id).update({"is_active": False})
        db.commit()
