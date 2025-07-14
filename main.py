from fastapi import FastAPI
from app.api import endpoints_user, endpoints_course, endpoints_dashboard, endpoints_notification, endpoints_class, endpoints_ws

app = FastAPI()

app.include_router(endpoints_user.router)
app.include_router(endpoints_course.router)
app.include_router(endpoints_dashboard.router)
app.include_router(endpoints_notification.router)
app.include_router(endpoints_class.router)
app.include_router(endpoints_ws.router)
