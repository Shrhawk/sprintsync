from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.schemas.task import (
    TaskCreate, 
    TaskUpdate, 
    TaskResponse, 
    TaskStatusUpdate,
    TaskTimeUpdate,
    TaskAssignmentUpdate
)
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status_filter: Optional[TaskStatus] = Query(None),
    assigned_to_me: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    
    if assigned_to_me:
        # assigned to me or created by me (if not assigned)
        query = select(Task).where(
            (Task.assigned_to == current_user.id) | 
            (and_(Task.user_id == current_user.id, Task.assigned_to.is_(None)))
        )
    else:
        query = select(Task).where(Task.user_id == current_user.id)
    
    if status_filter:
        query = query.where(Task.status == status_filter)
    
    query = query.order_by(Task.created_at.desc())
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    
    assigned_to = task_in.assigned_to
    if assigned_to and assigned_to != current_user.id:
        if not current_user.is_admin:
            raise HTTPException(403, "Only admins can assign tasks to others")
        
        # check if user exists
        user = await db.execute(select(User).where(User.id == assigned_to))
        if not user.scalar_one_or_none():
            raise HTTPException(404, "User not found")
    
    if not assigned_to:
        assigned_to = current_user.id
    
    task = Task(
        title=task_in.title,
        description=task_in.description,
        user_id=current_user.id,
        assigned_to=assigned_to,
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    
    task = await db.execute(
        select(Task).where(
            and_(
                Task.id == task_id, 
                (Task.user_id == current_user.id) | (Task.assigned_to == current_user.id)
            )
        )
    )
    task = task.scalar_one_or_none()
    
    if not task:
        raise HTTPException(404, "Task not found")
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    
    result = await db.execute(select(Task).where(
        and_(Task.id == str(task_id), Task.user_id == current_user.id)
    ))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(404, "Task not found")
    
    # simple field update
    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: UUID,
    status_update: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    
    result = await db.execute(select(Task).where(
        and_(Task.id == str(task_id), Task.user_id == current_user.id)
    ))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(404, "Not found")
    
    task.status = status_update.status
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}/time", response_model=TaskResponse)
async def add_time_to_task(
    task_id: UUID,
    time_update: TaskTimeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Add time to a task"""
    
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task.total_minutes += time_update.minutes_to_add
    await db.commit()
    await db.refresh(task)
    
    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task"""
    
    result = await db.execute(
        select(Task).where(
            and_(Task.id == str(task_id), Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    await db.delete(task)
    await db.commit()
    
    return {"message": "Task successfully deleted"}


@router.patch("/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    task_id: UUID,
    assignment: TaskAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Assign task to another user (admin only)"""
    
    # Get the task
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Validate assigned user if provided
    if assignment.assigned_to:
        result = await db.execute(select(User).where(User.id == assignment.assigned_to))
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
    
    # Update assignment
    task.assigned_to = assignment.assigned_to
    await db.commit()
    await db.refresh(task)
    
    return task


@router.get("/admin/all", response_model=List[TaskResponse])
async def list_all_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """List all tasks in the system (admin only)"""
    
    result = await db.execute(select(Task).order_by(Task.created_at.desc()))
    tasks = result.scalars().all()
    
    return tasks
