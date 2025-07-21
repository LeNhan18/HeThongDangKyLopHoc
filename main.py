# from fastapi import FastAPI
# from app.api import endpoints_user, endpoints_course, endpoints_dashboard, endpoints_notification, endpoints_class, endpoints_ws,endpoints_lesson,endpoints_section,endpoints_auth
# from fastapi.middleware.cors import CORSMiddleware
# app = FastAPI()
#
# app.include_router(endpoints_user.router)
# app.include_router(endpoints_course.router)
# app.include_router(endpoints_dashboard.router)
# app.include_router(endpoints_notification.router)
# app.include_router(endpoints_class.router)
# app.include_router(endpoints_ws.router)
#
# app.include_router(endpoints_lesson.router)
#
# app.include_router(endpoints_section.router)
# app.include_router(endpoints_auth.router)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
from fastapi import FastAPI
from app.api import endpoints_auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(endpoints_auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)