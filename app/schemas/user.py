from pydantic import BaseModel, EmailStr
from typing import List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class User(BaseModel):
    id: int
    email: EmailStr
    name: str | None = None
    is_active: bool
    roles: List[str] = []
    class Config:
        from_attributes = True 