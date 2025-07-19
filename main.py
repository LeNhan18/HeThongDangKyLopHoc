from fastapi import FastAPI
from app.api import endpoints_user, endpoints_course, endpoints_dashboard, endpoints_notification, endpoints_class, endpoints_ws
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.include_router(endpoints_user.router)
app.include_router(endpoints_course.router)
app.include_router(endpoints_dashboard.router)
app.include_router(endpoints_notification.router)
app.include_router(endpoints_class.router)
app.include_router(endpoints_ws.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://localhost:3000"] để bảo mật hơn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)