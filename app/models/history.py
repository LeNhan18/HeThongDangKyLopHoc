from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class ClassHistory(Base):
    __tablename__ = "class_histories"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    changed_by = Column(Integer, ForeignKey("users.id"))
    change_type = Column(String(255))
    change_time = Column(DateTime, default=datetime.utcnow)
    note = Column(String(1000), nullable=True) 