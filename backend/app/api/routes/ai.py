"""
AI assistance routes
"""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.schemas.ai import AISuggestionRequest, AISuggestionResponse, DailyPlanResponse
from app.core.deps import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/suggest-description", response_model=AISuggestionResponse)
async def suggest_task_description(
    request: AISuggestionRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Generate AI-powered task description from title"""
    
    suggestion = await ai_service.suggest_task_description(
        title=request.title,
        context=request.context
    )
    
    return suggestion


@router.get("/daily-plan", response_model=DailyPlanResponse)
async def get_daily_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Generate AI-powered daily plan for current user"""
    
    # Get user's active tasks (TODO and IN_PROGRESS)
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS])
        )
        .order_by(Task.created_at.desc())
    )
    
    user_tasks = result.scalars().all()
    
    # Generate daily plan
    plan = await ai_service.generate_daily_plan(
        user=current_user,
        user_tasks=user_tasks
    )
    
    return plan
