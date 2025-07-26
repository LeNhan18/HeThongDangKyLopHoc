from app.schemas.user import User
from fastapi import Depends, HTTPException

def get_current_user():
    # Dummy user, thay bằng lấy từ token/session thực tế
    # Tạm thời cho tất cả user có quyền admin để test
    return User(id=1, email="test@example.com", name="Test User", is_active=True, roles=["admin"])

def require_roles(required_roles: list[str]):
    def checker(user: User = Depends(get_current_user)):
        if not any(r.lower() in [role.lower() for role in user.roles] for r in required_roles):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này.")
        return user
    return checker 