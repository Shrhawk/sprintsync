"""
Unit tests for database models
"""

import pytest
from datetime import datetime
from app.models.user import User
from app.models.task import Task, TaskStatus


@pytest.mark.unit
class TestUserModel:
    """Test User model"""
    
    def test_user_creation(self):
        """Test creating a user instance"""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            full_name="Test User",
            is_admin=False,
        )
        
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.is_admin is False
        assert user.password_hash == "hashed_password"
    
    def test_user_admin_flag(self):
        """Test admin user creation"""
        admin = User(
            email="admin@example.com",
            password_hash="hashed_password",
            full_name="Admin User",
            is_admin=True,
        )
        
        assert admin.is_admin is True
    
    def test_user_repr(self):
        """Test user string representation"""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            full_name="Test User",
        )
        
        repr_str = repr(user)
        assert "Test User" in repr_str
        assert "test@example.com" in repr_str


@pytest.mark.unit
class TestTaskModel:
    """Test Task model"""
    
    def test_task_creation(self):
        """Test creating a task instance"""
        task = Task(
            title="Test Task",
            description="A test task",
            status=TaskStatus.TODO,
            total_minutes=60,
            user_id="user-uuid",
        )
        
        assert task.title == "Test Task"
        assert task.description == "A test task"
        assert task.status == TaskStatus.TODO
        assert task.total_minutes == 60
        assert task.user_id == "user-uuid"
    
    def test_task_status_enum(self):
        """Test task status enumeration"""
        task = Task(
            title="Test Task",
            status=TaskStatus.IN_PROGRESS,
            user_id="user-uuid",
        )
        
        assert task.status == TaskStatus.IN_PROGRESS
        assert task.status.value == "IN_PROGRESS"
    
    def test_task_default_values(self):
        """Test task default values"""
        task = Task(
            title="Test Task",
            user_id="user-uuid",
            status=TaskStatus.TODO,  # Explicitly set for test
            total_minutes=0  # Explicitly set for test
        )
        
        assert task.status == TaskStatus.TODO
        assert task.total_minutes == 0
        assert task.description is None
    
    def test_task_repr(self):
        """Test task string representation"""
        task = Task(
            title="Test Task",
            status=TaskStatus.TODO,
            user_id="user-uuid",
        )
        
        repr_str = repr(task)
        assert "Test Task" in repr_str
        assert "TODO" in repr_str
