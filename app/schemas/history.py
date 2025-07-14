from pydantic import BaseModel
from datetime import datetime

class ClassHistoryBase(BaseModel):
    class_id: int
    changed_by: int
    change_type: str
    note: str = None

class ClassHistoryCreate(ClassHistoryBase):
    pass

class ClassHistory(ClassHistoryBase):
    id: int
    change_time: datetime
    class Config:
        from_attributes = True 