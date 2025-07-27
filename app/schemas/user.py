from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[str]] = None

class User(BaseModel):
    id: int
    email: EmailStr
    name: str | None = None
    is_active: bool
    roles: List[str] = []
    class Config:
        from_attributes = True 