# File: app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

# --- 1. Import tất cả các router từ thư mục app/api ---
from app.api import (
    endpoints_user,
    endpoints_course,
    endpoints_dashboard,
    endpoints_notification,
    endpoints_class,
    endpoints_ws,
    endpoints_lesson,
    endpoints_section,
    auth,
    endpoints_upload
)

# --- 2. Khởi tạo ứng dụng FastAPI ---
app = FastAPI(
    title="Hệ Thống Đăng Ký Khóa Học API",
    description="API để quản lý việc đăng ký khóa học và cập nhật real-time.",
    version="1.0.0",
)

# --- 3. Cấu hình Middleware ---

# Cấu hình Session Middleware (để quản lý session/cookie)
# QUAN TRỌNG: Thay "your_secret_key" bằng một chuỗi ký tự ngẫu nhiên và bí mật
app.add_middleware(SessionMiddleware, secret_key="your_secret_key_should_be_long_and_random")

# --- PHẦN SỬA LỖI QUAN TRỌNG NHẤT ---
# Cấu hình CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost:3000",  # Địa chỉ của ứng dụng React của bạn
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # THAY ĐỔI 1: Chỉ định chính xác origin của frontend
    allow_credentials=True,      # Cho phép gửi và nhận cookie
    allow_methods=["*"],         # Cho phép tất cả các phương thức
    allow_headers=["*"],         # Cho phép tất cả các header
)


# --- 4. Gắn (include) các router vào ứng dụng ---
# Việc thêm prefix và tags giúp tổ chức API trên /docs gọn gàng hơn
app.include_router(auth.router, prefix="/auth", tags=["1. Authentication"])
app.include_router(endpoints_user.router, prefix="/users", tags=["2. Users"])
app.include_router(endpoints_course.router, prefix="/courses", tags=["3. Courses"])
# Sửa lại prefix của class router để khớp với log lỗi của bạn
app.include_router(endpoints_class.router, prefix="", tags=["4. Classes & Registration"])
app.include_router(endpoints_lesson.router, prefix="/lessons", tags=["5. Lessons"])
app.include_router(endpoints_section.router, prefix="/sections", tags=["6. Sections"])
app.include_router(endpoints_notification.router, prefix="/notifications", tags=["7. Notifications"])
app.include_router(endpoints_dashboard.router, prefix="/dashboard", tags=["8. Dashboard"])
app.include_router(endpoints_upload.router, prefix="/upload", tags=["9. Upload"])
app.include_router(endpoints_ws.router, tags=["10. WebSocket"])

# --- 5. Mount thư mục static để phục vụ file tĩnh (ví dụ: hình ảnh) ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 6. Endpoint gốc để kiểm tra ---
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Chào mừng đến với API Đăng ký Khóa học!"}

