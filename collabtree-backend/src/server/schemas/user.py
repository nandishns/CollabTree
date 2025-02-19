from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    access_token: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    id : int
    email : str
    created_at : datetime

class TokenData(BaseModel):
    email: Optional[str] = None 