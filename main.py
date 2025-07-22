from fastapi import FastAPI
from app.api import endpoints_user, endpoints_course, endpoints_dashboard, endpoints_notification, endpoints_class, endpoints_ws,endpoints_lesson,endpoints_section,auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(endpoints_user.router)
app.include_router(endpoints_course.router)
app.include_router(endpoints_dashboard.router)
app.include_router(endpoints_notification.router)
app.include_router(endpoints_class.router)
app.include_router(endpoints_ws.router)
app.include_router(endpoints_lesson.router)
app.include_router(endpoints_section.router)

# Thêm prefix và tags cho auth router
app.include_router(auth.router, tags=["Authentication"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)