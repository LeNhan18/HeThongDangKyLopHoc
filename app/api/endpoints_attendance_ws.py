from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
import json
from datetime import datetime

from app.database import get_db
from app.models.user import User

router = APIRouter()

class AttendanceConnectionManager:
    def __init__(self):
        # Lưu trữ connections theo class_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, class_id: int):
        await websocket.accept()
        if class_id not in self.active_connections:
            self.active_connections[class_id] = []
        self.active_connections[class_id].append(websocket)
        
    def disconnect(self, websocket: WebSocket, class_id: int):
        if class_id in self.active_connections:
            self.active_connections[class_id].remove(websocket)
            if not self.active_connections[class_id]:
                del self.active_connections[class_id]
                
    async def send_to_class(self, message: dict, class_id: int):
        """Gửi message tới tất cả connections của một lớp"""
        if class_id in self.active_connections:
            for connection in self.active_connections[class_id].copy():
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Connection bị lỗi, remove nó
                    self.active_connections[class_id].remove(connection)
                    
    async def broadcast_attendance_update(self, class_id: int, student_id: int, status: str, student_name: str = None):
        """Broadcast cập nhật điểm danh"""
        message = {
            "type": "attendance_update",
            "class_id": class_id,
            "student_id": student_id,
            "status": status,
            "student_name": student_name,
            "timestamp": datetime.now().isoformat()
        }
        await self.send_to_class(message, class_id)
        
    async def broadcast_student_joined(self, class_id: int, student_id: int, student_name: str):
        """Broadcast học viên tham gia lớp"""
        message = {
            "type": "student_joined",
            "class_id": class_id,
            "student_id": student_id,
            "student_name": student_name,
            "timestamp": datetime.now().isoformat()
        }
        await self.send_to_class(message, class_id)

# Global manager instance
attendance_manager = AttendanceConnectionManager()

def verify_token(token: str, db: Session) -> User:
    """Xác thực token đơn giản - không cần JWT"""
    # Bỏ qua xác thực token, trả về user mặc định
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        # Tạo user fallback
        class FakeUser:
            def __init__(self):
                self.id = 1
                self.email = "admin@example.com"
                self.full_name = "Admin"
        return FakeUser()
    return user

@router.websocket("/ws/attendance/{class_id}")
async def attendance_websocket(
    websocket: WebSocket, 
    class_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint cho real-time attendance updates - đơn giản hóa"""
    try:
        # Kết nối WebSocket mà không cần token
        await attendance_manager.connect(websocket, class_id)
        
        # Gửi thông báo kết nối thành công
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "class_id": class_id,
            "message": "Connected to attendance updates"
        }))
        
        try:
            while True:
                # Nhận message từ client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Xử lý các loại message
                if message.get("type") == "attendance_update":
                    # Broadcast cập nhật điểm danh
                    await attendance_manager.broadcast_attendance_update(
                        class_id=class_id,
                        student_id=message.get("student_id"),
                        status=message.get("status"),
                        student_name=message.get("student_name")
                    )
                    
                elif message.get("type") == "attendance_session_started":
                    # Admin/Teacher mở điểm danh - broadcast tới tất cả students
                    print(f"DEBUG: Broadcasting attendance_session_started to class {class_id}")
                    await attendance_manager.send_to_class({
                        "type": "attendance_session_started",
                        "class_id": class_id,
                        "timestamp": datetime.now().isoformat()
                    }, class_id)
                    
                elif message.get("type") == "attendance_session_ended":
                    # Admin/Teacher đóng điểm danh - broadcast tới tất cả students
                    print(f" DEBUG: Broadcasting attendance_session_ended to class {class_id}")
                    await attendance_manager.send_to_class({
                        "type": "attendance_session_ended", 
                        "class_id": class_id,
                        "timestamp": datetime.now().isoformat()
                    }, class_id)
                    
                elif message.get("type") == "student_join":
                    # Broadcast học viên tham gia
                    await attendance_manager.broadcast_student_joined(
                        class_id=class_id,
                        student_id=message.get("student_id"),
                        student_name=message.get("student_name")
                    )
                    
                elif message.get("type") == "self_attendance_marked":
                    # Student đã điểm danh - broadcast tới admin/teacher
                    student_id = message.get("student_id")
                    status = message.get("status")
                    
                    # Lấy thông tin student - sử dụng database dependency
                    try:
                        from app.database import get_db
                        from app.models.user import User
                        db_gen = get_db()
                        db = next(db_gen)
                        try:
                            student = db.query(User).filter(User.id == student_id).first()
                            student_name = student.name if student else f"Student {student_id}"
                        finally:
                            db.close()
                    except Exception as e:
                        print(f" DEBUG: Error getting student name: {e}")
                        student_name = f"Student {student_id}"
                    
                    print(f" DEBUG: Broadcasting self_attendance_marked - Student: {student_name}, Status: {status}")
                    await attendance_manager.send_to_class({
                        "type": "self_attendance_marked",
                        "student_id": student_id,
                        "student_name": student_name,
                        "status": status,
                        "timestamp": datetime.now().isoformat()
                    }, class_id)
                    
                elif message.get("type") == "chat_message":
                    # Broadcast chat message
                    await attendance_manager.send_to_class({
                        "type": "chat_message",
                        "message": message.get("message"),
                        "user": message.get("user", {"name": "Unknown"}),
                        "timestamp": datetime.now().isoformat()
                    }, class_id)
                    
                elif message.get("type") == "join":
                    # User joining classroom
                    print(f" DEBUG: User joining class {class_id}")
                    
                elif message.get("type") == "leave":
                    # User leaving classroom  
                    print(f"DEBUG: User leaving class {class_id}")
                    
                elif message.get("type") == "ping":
                    # Heartbeat
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
        except WebSocketDisconnect:
            pass
            
    except Exception as e:
        await websocket.close(code=1008, reason=str(e))
    finally:
        attendance_manager.disconnect(websocket, class_id)

# Helper function để gửi update từ API endpoints
async def send_attendance_update(class_id: int, student_id: int, status: str, student_name: str = None):
    """Helper function để gửi cập nhật từ API endpoints"""
    await attendance_manager.broadcast_attendance_update(class_id, student_id, status, student_name)

async def send_student_joined(class_id: int, student_id: int, student_name: str):
    """Helper function để gửi thông báo tham gia từ API endpoints"""
    await attendance_manager.broadcast_student_joined(class_id, student_id, student_name)
