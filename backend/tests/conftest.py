"""
Test configuration and fixtures for SprintSync backend
"""

import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models import User, Task, TaskStatus
from app.core.security import get_password_hash
from app.core.config import settings


# Test database URL - use in-memory SQLite for speed
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test"""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database dependency override"""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user"""
    import uuid
    unique_email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        password_hash=get_password_hash("testpassword123"),
        full_name="Test User",
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession) -> User:
    """Create a test admin user"""
    import uuid
    unique_email = f"admin-{uuid.uuid4().hex[:8]}@example.com"
    admin = User(
        email=unique_email,
        password_hash=get_password_hash("adminpassword123"),
        full_name="Admin User",
        is_admin=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def test_task(db_session: AsyncSession, test_user: User) -> Task:
    """Create a test task"""
    task = Task(
        title="Test Task",
        description="A test task description",
        status=TaskStatus.TODO,
        total_minutes=60,
        user_id=test_user.id,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, test_user: User) -> dict[str, str]:
    """Get authentication headers for test user"""
    response = await client.post(
        "/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient, test_admin: User) -> dict[str, str]:
    """Get authentication headers for admin user"""
    response = await client.post(
        "/auth/login",
        data={
            "username": test_admin.email,
            "password": "adminpassword123"
        }
    )
    assert response.status_code == 200
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


# Mock AI service for testing
class MockAIService:
    """Mock AI service for testing without API calls"""
    
    async def suggest_task_description(self, title: str, context: str = None):
        """Mock task description generation"""
        return {
            "suggestion": f"AI-generated description for: {title}",
            "success": True,
            "fallback": False
        }
    
    async def generate_daily_plan(self, user, user_tasks):
        """Mock daily plan generation"""
        return {
            "tasks": [
                {
                    "title": "Mock Task 1",
                    "estimated_minutes": 90,
                    "priority": "high",
                    "description": "Mock task description"
                }
            ],
            "total_estimated_minutes": 90,
            "plan_summary": "Mock daily plan summary",
            "success": True,
            "fallback": False
        }


@pytest.fixture
def mock_ai_service(monkeypatch):
    """Mock the AI service to avoid API calls during tests"""
    from app.services import ai_service
    
    mock_service = MockAIService()
    monkeypatch.setattr(ai_service, "ai_service", mock_service)
    return mock_service
