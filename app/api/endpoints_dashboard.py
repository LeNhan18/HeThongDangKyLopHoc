from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.class_model import Class
from app.models.user import User
from app.models.registration import Registration

router = APIRouter()

@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    total_classes = db.query(Class).count()
    total_users = db.query(User).count()
    total_registrations = db.query(Registration).count()
    return {
        "total_classes": total_classes,
        "total_users": total_users,
        "total_registrations": total_registrations
    } 