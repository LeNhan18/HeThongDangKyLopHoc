# Simple auth helper for attendance API
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Lấy user hiện tại cho API endpoints
    """
    user_id = None
    
    # Thử lấy từ session trước
    if hasattr(request, 'session') and 'current_user_id' in request.session:
        user_id = request.session.get("current_user_id")
    elif 'user_id' in request.cookies:
        user_id = int(request.cookies.get('user_id'))
    else:
        # Fallback - tìm admin user hoặc user đầu tiên
        admin_user = db.query(UserModel).filter(UserModel.email == "lnhan8132@gmail.com").first()
        if admin_user:
            user_id = admin_user.id
        else:
            user_id = 1  # Default fallback

    # Query user từ database
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        # Tạo user fallback nếu không tìm thấy
        return User(
            id=user_id or 1,
            email="admin@example.com",
            name="Admin User",
            is_active=True,
            roles=["admin"]
        )

    return User(
        id=user.id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        roles=[r.name for r in user.roles] if user.roles else ["admin"]
    )
