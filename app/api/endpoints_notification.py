from fastapi import APIRouter

router = APIRouter()

@router.post("/notify/")
def send_notification(message: str):
    # Giả lập gửi thông báo
    return {"status": "sent", "message": message} 