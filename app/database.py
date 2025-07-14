# File: app/database.py

from sqlalchemy import create_engine
# THAY ĐỔI Ở ĐÂY: Import declarative_base từ sqlalchemy.orm
from sqlalchemy.orm import declarative_base, sessionmaker

# !!! QUAN TRỌNG: Hãy thay đổi các thông số bên dưới cho phù hợp với MySQL của bạn
DATABASE_URL = "mysql+mysqlconnector://root:nhan1811@localhost:3306/HTDK"


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
