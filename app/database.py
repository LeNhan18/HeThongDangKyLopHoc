# File: app/database.py

from sqlalchemy import create_engine
# THAY ĐỔI Ở ĐÂY: Import declarative_base từ sqlalchemy.orm
from sqlalchemy.orm import declarative_base, sessionmaker

# !!! QUAN TRỌNG: Hãy thay đổi các thông số bên dưới cho phù hợp với MySQL của bạn
DATABASE_URL = "mysql+mysqlconnector://root:nhan1811@127.0.0.1:3306/HTDK"

# --- Phần còn lại giữ nguyên ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sử dụng hàm đã import
Base = declarative_base()

# Dependency để lấy DB session trong mỗi request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Bổ sung tạo bảng khi chạy file này ---
import app.models.user
import app.models.course
import app.models.class_model
import app.models.registration
import app.models.history
import app.models.notification
import app.models.role
import app.models.user_role
import app.models.attendance
import app.models.feedback

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Đã tạo xong tất cả các bảng!")
