from pydantic import BaseModel, EmailStr

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
    role: str
    class Config:
        from_attributes = True 