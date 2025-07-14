from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import CRUD, Schemas

router = APIRouter()

# Giả lập user hiện tại (chưa có auth thực tế)
def get_current_user():
    return Schemas.User(id=1, email="student@example.com", is_active=True, role="student")

@router.post("/register_class/{class_id}")
def register_class(class_id: int, db: Session = Depends(get_db), user: Schemas.User = Depends(get_current_user)):
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Chỉ học viên mới được đăng ký lớp.")
    class_obj = CRUD.get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if CRUD.check_schedule_conflict(db, user.id, class_obj.schedule):
        raise HTTPException(status_code=400, detail="Bạn đã đăng ký lớp khác trùng lịch.")
    reg = CRUD.create_registration(db, student_id=user.id, class_id=class_id)
    if not reg:
        raise HTTPException(status_code=400, detail="Đã đăng ký lớp này rồi.")
    CRUD.create_class_history(db, class_id=class_id, changed_by=user.id, change_type="register", note="Đăng ký lớp")
    count = CRUD.count_students_in_class(db, class_id)
    return {"message": "Đăng ký thành công", "current_count": count}

@router.get("/class/{class_id}/count")
def get_class_count(class_id: int, db: Session = Depends(get_db)):
    count = CRUD.count_students_in_class(db, class_id)
    return {"class_id": class_id, "current_count": count}

@router.post("/class/{class_id}/change_schedule")
def change_class_schedule(class_id: int, new_schedule: str, db: Session = Depends(get_db), user: Schemas.User = Depends(get_current_user)):
    if user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được thay đổi lịch học.")
    class_obj = CRUD.get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    old_schedule = class_obj.schedule
    class_obj.schedule = new_schedule
    db.commit()
    CRUD.create_class_history(db, class_id=class_id, changed_by=user.id, change_type="update_schedule", note=f"Đổi lịch từ {old_schedule} sang {new_schedule}")
    # Gửi thông báo realtime sẽ được xử lý ở WebSocket
    return {"message": "Đã thay đổi lịch học", "old_schedule": old_schedule, "new_schedule": new_schedule}

@router.get("/class/{class_id}/history")
def get_class_history(class_id: int, db: Session = Depends(get_db), user: Schemas.User = Depends(get_current_user)):
    if user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị mới được xem lịch sử thay đổi.")
    histories = CRUD.get_class_histories(db, class_id)
    return histories 