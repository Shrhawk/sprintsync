"""
Task schemas for API validation
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.task import TaskStatus


class TaskBase(BaseModel):
    """Base task schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)


class TaskCreate(TaskBase):
    """Schema for task creation"""
    assigned_to: Optional[UUID] = None  # For admin task assignment


class TaskUpdate(BaseModel):
    """Schema for task updates"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    total_minutes: Optional[int] = Field(None, ge=0)
    assigned_to: Optional[UUID] = None  # For admin task assignment


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status"""
    status: TaskStatus


class TaskTimeUpdate(BaseModel):
    """Schema for updating task time"""
    minutes_to_add: int = Field(..., gt=0, le=1440)  # Max 24 hours per session


class TaskAssignmentUpdate(BaseModel):
    """Schema for admin task assignment"""
    assigned_to: Optional[UUID] = None


class TaskResponse(TaskBase):
    """Schema for task response"""
    id: UUID
    status: TaskStatus
    total_minutes: int
    user_id: UUID
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
