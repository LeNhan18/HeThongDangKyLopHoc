from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime

from app.database import get_db
from app import CRUD

router = APIRouter()

# ==============================
# 1️⃣ Quản lý số lượng đăng ký theo lớp
# ==============================
class ClassCountManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except:
                self.disconnect(connection)

manager = ClassCountManager()

@router.websocket("/ws/class/{class_id}")
async def websocket_class_count(websocket: WebSocket, class_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # chỉ giữ kết nối
            count = CRUD.count_students_in_class(db, class_id)
            await manager.broadcast({"class_id": class_id, "current_count": count})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ==============================
# 2️⃣ Quản lý thông báo theo class
# ==============================
class ClassNotificationManager:
    def __init__(self):
        self.class_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, class_id: int):
        await websocket.accept()
        self.class_connections.setdefault(class_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, class_id: int):
        if class_id in self.class_connections:
            if websocket in self.class_connections[class_id]:
                self.class_connections[class_id].remove(websocket)
            if not self.class_connections[class_id]:
                del self.class_connections[class_id]

    async def notify_class(self, class_id: int, message: dict):
        for ws in self.class_connections.get(class_id, []):
            try:
                await ws.send_json(message)
            except:
                self.disconnect(ws, class_id)

notification_manager = ClassNotificationManager()

@router.websocket("/ws/notify/class/{class_id}")
async def websocket_notify_class(websocket: WebSocket, class_id: int):
    await notification_manager.connect(websocket, class_id)
    try:
        while True:
            await websocket.receive_text()  # giữ kết nối
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, class_id)


# ==============================
# 3️⃣ Quản lý thông báo Admin/Teacher
# ==============================
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
        for ws in list(self.admin_connections):
            try:
                await ws.send_json(message)
            except:
                self.disconnect_admin(ws)

    async def notify_teachers(self, message: dict):
        for ws in list(self.teacher_connections):
            try:
                await ws.send_json(message)
            except:
                self.disconnect_teacher(ws)

    async def notify_all_staff(self, message: dict):
        await self.notify_admins(message)
        await self.notify_teachers(message)

admin_notification_manager = AdminNotificationManager()

@router.websocket("/ws/admin/notifications")
async def websocket_admin_notifications(websocket: WebSocket):
    await admin_notification_manager.connect_admin(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        admin_notification_manager.disconnect_admin(websocket)

@router.websocket("/ws/teacher/notifications")
async def websocket_teacher_notifications(websocket: WebSocket):
    await admin_notification_manager.connect_teacher(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        admin_notification_manager.disconnect_teacher(websocket)


# ==============================
# 4️⃣ Thông báo cá nhân cho 1 user
# ==============================
class PersonalNotificationManager:
    def __init__(self):
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.user_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_personal_message(self, user_id: int, message: dict):
        for ws in self.user_connections.get(user_id, []):
            try:
                await ws.send_json(message)
            except:
                self.disconnect(ws, user_id)

ws_manager = PersonalNotificationManager()

@router.websocket("/ws/user/{user_id}/notifications")
async def websocket_user_notifications(websocket: WebSocket, user_id: int):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)


# ==============================
# 5️⃣ Hàm tiện ích gửi thông báo
# ==============================
async def send_notification_to_staff(notification_type: str, message: str, data: dict = None):
    notification = {
        "type": notification_type,
        "message": message,
        "data": data or {},
        "timestamp": str(datetime.now())
    }
    await admin_notification_manager.notify_all_staff(notification)

async def send_notification_to_user(user_id: int, notification_type: str, message: str, data: dict = None):
    notification = {
        "type": notification_type,
        "message": message,
        "data": data or {},
        "timestamp": str(datetime.now())
    }
    await ws_manager.send_personal_message(user_id, notification)

@router.post("/test-notification")
async def test_notification():
    await send_notification_to_staff("test", "Đây là thông báo test từ backend", {"test": True})
    return {"message": "Test notification sent"}
