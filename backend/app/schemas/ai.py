"""
AI assistance schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AISuggestionRequest(BaseModel):
    """Request schema for AI task description generation"""
    title: str = Field(..., min_length=1, max_length=200)
    context: Optional[str] = Field(None, max_length=500)


class AISuggestionResponse(BaseModel):
    """Response schema for AI suggestions"""
    suggestion: str
    success: bool
    fallback: bool = False


class DailyPlanTask(BaseModel):
    """Individual task in daily plan"""
    title: str
    estimated_minutes: int
    priority: str  # "high", "medium", "low"
    description: Optional[str] = None


class DailyPlanResponse(BaseModel):
    """Response schema for daily plan"""
    tasks: List[DailyPlanTask]
    total_estimated_minutes: int
    plan_summary: str
    success: bool
    fallback: bool = False
