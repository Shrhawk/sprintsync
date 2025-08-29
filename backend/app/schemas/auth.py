"""
Authentication schemas
"""

from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[str] = None
