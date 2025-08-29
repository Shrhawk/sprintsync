"""
User schemas for API validation
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=6, max_length=100)
    is_admin: bool = False


class UserUpdate(BaseModel):
    """Schema for user updates"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response"""
    id: UUID
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
