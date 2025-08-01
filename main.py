# File: app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api import (
    auth,
    endpoints_user,
    endpoints_course,
    endpoints_class,
    endpoints_lesson,
    endpoints_section,
    endpoints_notification,
    endpoints_dashboard,
    endpoints_upload,
    endpoints_ws,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key="nhanle",  # chuỗi dài, random
    max_age=3600  # thời gian sống session 1 giờ
)

# --- Include các router với prefix rõ ràng ---
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(endpoints_user.router)
app.include_router(endpoints_course.router)
app.include_router(endpoints_class.router)
app.include_router(endpoints_lesson.router)
app.include_router(endpoints_section.router)
app.include_router(endpoints_notification.router)
app.include_router(endpoints_dashboard.router)
app.include_router(endpoints_upload.router)
app.include_router(endpoints_ws.router)

# --- Mount static ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Debug: In danh sách tất cả route khi khởi động ---
@app.on_event("startup")
async def debug_routes():
    print("\n=== ALL ROUTES ===")
    for route in app.routes:
        print(f"{route.path} -> {route.name}")
    print("==================\n")
