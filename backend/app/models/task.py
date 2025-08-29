import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class Task(Base):
    
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    total_minutes = Column(Integer, default=0, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)  # Task creator
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)  # Task assignee
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}', user_id={self.user_id})>"
