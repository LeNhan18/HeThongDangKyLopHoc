from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import CRUD
from typing import List

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