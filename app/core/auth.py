from app.schemas.user import User

def get_current_user():
    # Dummy user, thay bằng lấy từ token/session thực tế
    # Tạm thời cho tất cả user có quyền admin để test
    return User(id=1, email="test@example.com", name="Test User", is_active=True, roles=["admin"]) 