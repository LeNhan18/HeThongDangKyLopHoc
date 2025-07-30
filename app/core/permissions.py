from fastapi import Depends, HTTPException
from app.schemas.user import User
from app.core.auth import get_current_user_debug

def require_roles(required_roles: list[str]):
    def checker(user: User = Depends(get_current_user_debug)):
        if not any(r.lower() in [role.lower() for role in user.roles] for r in required_roles):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này.")
        return user
    return checker 