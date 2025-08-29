"""
Statistics and analytics routes
"""

from typing import Any, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter()


class UserStats(BaseModel):
    """User statistics model"""
    user_id: str
    full_name: str
    email: str
    total_tasks: int
    completed_tasks: int
    total_minutes: int
    completion_rate: float


class UserSummary(BaseModel):
    """Current user summary statistics"""
    total_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    total_minutes_logged: int
    average_minutes_per_task: float
    completion_rate: float


@router.get("/user-summary", response_model=UserSummary)
async def get_user_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get summary statistics for current user"""
    
    # Get all user's tasks
    result = await db.execute(
        select(Task).where(Task.user_id == current_user.id)
    )
    user_tasks = result.scalars().all()
    
    # Calculate statistics
    total_tasks = len(user_tasks)
    todo_tasks = len([t for t in user_tasks if t.status == TaskStatus.TODO])
    in_progress_tasks = len([t for t in user_tasks if t.status == TaskStatus.IN_PROGRESS])
    completed_tasks = len([t for t in user_tasks if t.status == TaskStatus.DONE])
    
    total_minutes = sum(task.total_minutes for task in user_tasks)
    average_minutes = total_minutes / total_tasks if total_tasks > 0 else 0
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return UserSummary(
        total_tasks=total_tasks,
        todo_tasks=todo_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        total_minutes_logged=total_minutes,
        average_minutes_per_task=round(average_minutes, 2),
        completion_rate=round(completion_rate, 2)
    )


@router.get("/top-users", response_model=List[UserStats])
async def get_top_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Get leaderboard of top users by time logged (admin only)"""
    
    # Get all users with their task statistics
    result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            func.count(Task.id).label("total_tasks"),
            func.count(
                Task.id.filter(Task.status == TaskStatus.DONE)
            ).label("completed_tasks"),
            func.coalesce(func.sum(Task.total_minutes), 0).label("total_minutes")
        )
        .outerjoin(Task)
        .group_by(User.id, User.full_name, User.email)
        .order_by(func.coalesce(func.sum(Task.total_minutes), 0).desc())
    )
    
    user_stats = []
    for row in result:
        completion_rate = (
            (row.completed_tasks / row.total_tasks * 100) 
            if row.total_tasks > 0 else 0
        )
        
        user_stats.append(UserStats(
            user_id=str(row.id),
            full_name=row.full_name,
            email=row.email,
            total_tasks=row.total_tasks,
            completed_tasks=row.completed_tasks,
            total_minutes=row.total_minutes,
            completion_rate=round(completion_rate, 2)
        ))
    
    return user_stats


@router.get("/recent-activity")
async def get_recent_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get recent activity for current user"""
    
    # Get tasks updated in the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    result = await db.execute(
        select(Task)
        .where(
            and_(
                Task.user_id == current_user.id,
                Task.updated_at >= seven_days_ago
            )
        )
        .order_by(Task.updated_at.desc())
        .limit(10)
    )
    
    recent_tasks = result.scalars().all()
    
    return {
        "recent_tasks": [
            {
                "id": str(task.id),
                "title": task.title,
                "status": task.status.value,
                "total_minutes": task.total_minutes,
                "updated_at": task.updated_at.isoformat()
            }
            for task in recent_tasks
        ]
    }
