"""
Pydantic schemas for API request/response validation
"""

from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatusUpdate
from app.schemas.auth import Token, TokenData
from app.schemas.ai import AISuggestionRequest, AISuggestionResponse, DailyPlanResponse

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin",
    "TaskCreate", "TaskUpdate", "TaskResponse", "TaskStatusUpdate", 
    "Token", "TokenData",
    "AISuggestionRequest", "AISuggestionResponse", "DailyPlanResponse"
]
