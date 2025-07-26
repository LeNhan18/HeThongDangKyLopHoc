from app.schemas.user import User

def get_current_user():
    # Dummy user, thay bằng lấy từ token/session thực tế
    return User(id=3, email="lnhan8132@gmail.com", name="Admin", is_active=True, roles=["admin"]) 