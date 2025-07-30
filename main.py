from fastapi import FastAPI
from app.api import endpoints_user, endpoints_course, endpoints_dashboard, endpoints_notification, endpoints_class, endpoints_ws,endpoints_lesson,endpoints_section,auth
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints_upload import router as upload_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()

from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key="your_secret_key")

# Thêm CORS middleware trước tiên
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints_user.router)
app.include_router(endpoints_course.router)
app.include_router(endpoints_dashboard.router)
app.include_router(endpoints_notification.router)
app.include_router(endpoints_class.router)
app.include_router(endpoints_ws.router)
app.include_router(endpoints_lesson.router)
app.include_router(endpoints_section.router)
app.include_router(upload_router)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Thêm prefix và tags cho auth router
app.include_router(auth.router, tags=["Authentication"])