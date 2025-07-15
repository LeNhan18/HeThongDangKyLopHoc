from pydantic import BaseModel
from datetime import datetime

class RegistrationBase(BaseModel):
    class_id: int
    student_id: int

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: int
    registration_date: datetime
    class Config:
        from_attributes = True 