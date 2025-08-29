"""
User model for SprintSync
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String as SQLString
from sqlalchemy.orm import relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.task import Task


class User(Base):
    """User model"""
    
    __tablename__ = "users"
    
    id = Column(SQLString(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tasks = relationship("Task", foreign_keys="Task.user_id", back_populates="user", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', full_name='{self.full_name}')>"
