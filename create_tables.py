# File: create_tables.py

# Đầu tiên, import Base và engine từ app.database
from app.database import Base, engine

# SAU ĐÓ, import TẤT CẢ các model của bạn.
# Việc này sẽ đăng ký các model với đối tượng Base đã được import ở trên.
from app.models import user, role, user_role, class_model, attendance, registration, feedback, notification, history
# Giả sử bạn có file course.py trong models
# from app.models import course

def main():
    print("Bắt đầu tạo tất cả các bảng...")
    # Dùng Base đã được các model đăng ký để tạo bảng
    Base.metadata.create_all(bind=engine)
    print("✅ Hoàn tất! Các bảng đã được tạo.")
    print("Các bảng đã được đăng ký:", list(Base.metadata.tables.keys()))


if __name__ == "__main__":
    main()