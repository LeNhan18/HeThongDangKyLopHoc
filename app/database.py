# File: app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# !!! QUAN TRỌNG: Hãy thay đổi các thông số bên dưới cho phù hợp với MySQL của bạn
DATABASE_URL = "mysql+pymysql://root:nhan1811@127.0.0.1:3306/htdk"

# --- Phần còn lại giữ nguyên ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- SỬA LỖI: Import tất cả các model cần tạo ---
from app.models import user
from app.models import user_role
from app.models import role
from app.models import attendance
from app.models import class_model
from app.models import course
from app.models import feedback
from app.models import history
from app.models import registration
from app.models import notification
# ... (phần còn lại của file)
if __name__ == "__main__":
    print("\nBắt đầu tạo các bảng trong database...")
    Base.metadata.create_all(bind=engine)

    print("\n✅ Đã tạo xong tất cả các bảng!")
    print("Engine:", engine)
    print("Các bảng đã được đăng ký:", list(Base.metadata.tables.keys()))