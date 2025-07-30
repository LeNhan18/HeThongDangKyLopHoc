from urllib.request import Request

from app.schemas.user import User
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel


# 1. Fix: Dynamic user selection instead of hard-coded ID=1
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User

def get_current_user_debug(request: Request, db: Session = Depends(get_db)):
    """
    Lấy user hiện tại từ session (nếu có), nếu không thì mặc định user_id=1
    """
    user_id = 1
    if hasattr(request, 'session'):
        user_id = request.session.get("current_user_id", 1)
    print(f"🔍 DEBUG: get_current_user_debug called with user_id={user_id}")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        print(f"❌ DEBUG: User ID={user_id} not found in database")
        # Create different fallback users based on ID
        if user_id == 1:
            return User(id=1, email="admin@example.com", name="Admin User", is_active=True, roles=["admin"])
        else:
            return User(id=user_id, email=f"student{user_id}@example.com", name=f"Student {user_id}", is_active=True, roles=["student"])
    print(f"✅ DEBUG: Found user in database: ID={user.id}, Email={user.email}")
    print(f"🔍 DEBUG: User roles: {[r.name for r in user.roles]}")
    return User(
        id=user.id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        roles=[r.name for r in user.roles]
    )
# 3. Modified get_current_user_debug that uses session
def get_current_user_session_debug(db: Session = Depends(get_db), request: Request = None):
    """Debug function that respects session-based user switching"""
    if request and hasattr(request, 'session'):
        user_id = request.session.get("current_user_id", 1)  # Default to 1
    else:
        user_id = 1  # Fallback

    print(f"🔍 DEBUG: get_current_user_debug called with user_id={user_id}")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        print(f"❌ DEBUG: User ID={user_id} not found in database")
        # Create appropriate fallback user
        if user_id == 1:
            return User(id=1, email="admin@example.com", name="Admin User", is_active=True, roles=["admin"])
        else:
            return User(id=user_id, email=f"student{user_id}@example.com", name=f"Student {user_id}", is_active=True,
                        roles=["student"])

    print(f"✅ DEBUG: Found user in database: ID={user.id}, Email={user.email}")
    print(f"🔍 DEBUG: User roles: {[r.name for r in user.roles]}")

    return User(
        id=user.id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        roles=[r.name for r in user.roles]
    )
