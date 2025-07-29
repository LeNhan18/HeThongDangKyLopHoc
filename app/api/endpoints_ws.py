from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import CRUD
from typing import List
import json
from datetime import datetime

router = APIRouter()

# Quản lý kết nối WebSocket cập nhật số lượng đăng ký
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Quản lý thông báo cho admin/giảng viên
class AdminNotificationManager:
    def __init__(self):
        self.admin_connections: List[WebSocket] = []
        self.teacher_connections: List[WebSocket] = []
    
    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)
    
    async def connect_teacher(self, websocket: WebSocket):
        await websocket.accept()
        self.teacher_connections.append(websocket)
    
    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
    
    def disconnect_teacher(self, websocket: WebSocket):
        if websocket in self.teacher_connections:
            self.teacher_connections.remove(websocket)
    
    async def notify_admins(self, message: dict):
        """Gửi thông báo cho tất cả admin"""
        print(f"Notifying {len(self.admin_connections)} admins")
        for connection in self.admin_connections:
            try:
                await connection.send_json(message)
                print("Notification sent to admin successfully")
            except Exception as e:
                print(f"Error sending to admin: {e}")
                # Xóa connection lỗi
                self.admin_connections.remove(connection)
    
    async def notify_teachers(self, message: dict):
        """Gửi thông báo cho tất cả giảng viên"""
        for connection in self.teacher_connections:
            try:
                await connection.send_json(message)
            except:
                # Xóa connection lỗi
                self.teacher_connections.remove(connection)
    
    async def notify_all_staff(self, message: dict):
        """Gửi thông báo cho cả admin và teacher"""
        print(f"Notifying all staff. Message: {message}")
        await self.notify_admins(message)
        await self.notify_teachers(message)

admin_notification_manager = AdminNotificationManager()

@router.websocket("/ws/class/{class_id}")
async def websocket_class_count(websocket: WebSocket, class_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
            count = CRUD.count_students_in_class(db, class_id)
            await manager.broadcast({"class_id": class_id, "current_count": count})
    except WebSocketDisconnect:
        
        manager.disconnect(websocket)

# Quản lý kết nối WebSocket thông báo thay đổi lịch học cho từng lớp
class NotificationManager:
    def __init__(self):
        self.class_connections = {}  # {class_id: [WebSocket, ...]}
    async def connect(self, websocket: WebSocket, class_id: int):
        await websocket.accept()
        if class_id not in self.class_connections:
            self.class_connections[class_id] = []
        self.class_connections[class_id].append(websocket)
    def disconnect(self, websocket: WebSocket, class_id: int):
        if class_id in self.class_connections:
            self.class_connections[class_id].remove(websocket)
    async def notify_class(self, class_id: int, message: dict):
        if class_id in self.class_connections:
            for ws in self.class_connections[class_id]:
                await ws.send_json(message)

notification_manager = NotificationManager()

@router.websocket("/ws/notify/class/{class_id}")
async def websocket_notify_class(websocket: WebSocket, class_id: int):
    await notification_manager.connect(websocket, class_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, class_id)

# WebSocket cho admin nhận thông báo
@router.websocket("/ws/admin/notifications")
async def websocket_admin_notifications(websocket: WebSocket):
    print("Admin WebSocket connection attempt")
    await admin_notification_manager.connect_admin(websocket)
    print(f"Admin connected. Total admin connections: {len(admin_notification_manager.admin_connections)}")
    try:
        while True:
            # Giữ kết nối
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("Admin WebSocket disconnected")
        admin_notification_manager.disconnect_admin(websocket)

# WebSocket cho teacher nhận thông báo
@router.websocket("/ws/teacher/notifications")
async def websocket_teacher_notifications(websocket: WebSocket):
    await admin_notification_manager.connect_teacher(websocket)
    try:
        while True:
            # Giữ kết nối
            await websocket.receive_text()
    except WebSocketDisconnect:
        admin_notification_manager.disconnect_teacher(websocket)

# Hàm tiện ích để gửi thông báo từ các endpoint khác
async def send_notification_to_staff(notification_type: str, message: str, data: dict = None):
    """Gửi thông báo cho admin và teacher"""
    print(f"Sending notification: {notification_type} - {message}")
    notification = {
        "type": notification_type,
        "message": message,
        "data": data or {},
        "timestamp": str(datetime.now())
    }
    print(f"Admin connections: {len(admin_notification_manager.admin_connections)}")
    print(f"Teacher connections: {len(admin_notification_manager.teacher_connections)}")
    await admin_notification_manager.notify_all_staff(notification)

# Endpoint test để gửi thông báo
@router.post("/test-notification")
async def test_notification():
    """Test endpoint để gửi thông báo"""
    await send_notification_to_staff("test","Đây là thông báo test từ backend",{"test": True})
    return {"message": "Test notification sent"} 