"""
Unit tests for AI service
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.ai_service import AIService
from app.models.user import User
from app.models.task import Task, TaskStatus


@pytest.fixture
def ai_service_no_key():
    """AI service without API key (fallback mode)"""
    with patch('app.services.ai_service.settings.OPENAI_API_KEY', None):
        return AIService()


@pytest.fixture
def ai_service_with_key():
    """AI service with API key"""
    with patch('app.services.ai_service.settings.OPENAI_API_KEY', 'test-key'):
        return AIService()


@pytest.fixture
def mock_user():
    """Create a mock user"""
    user = MagicMock(spec=User)
    user.id = "test-user-id"
    user.full_name = "Test User"
    return user


@pytest.fixture
def mock_tasks():
    """Create mock tasks"""
    task1 = MagicMock(spec=Task)
    task1.title = "Complete project"
    task1.description = "Finish the important project"
    task1.status = TaskStatus.IN_PROGRESS
    task1.total_minutes = 120
    
    task2 = MagicMock(spec=Task)
    task2.title = "Review code"
    task2.description = "Review pull request"
    task2.status = TaskStatus.TODO
    task2.total_minutes = 0
    
    return [task1, task2]


@pytest.mark.asyncio
class TestTaskDescriptionSuggestion:
    """Test AI task description suggestions"""
    
    async def test_fallback_task_description_bug(self, ai_service_no_key):
        """Test fallback description for bug-related tasks"""
        title = "Fix critical bug in authentication"
        response = await ai_service_no_key.suggest_task_description(title)
        
        assert response.success is True
        assert response.fallback is True
        assert "fix the bug" in response.suggestion.lower()
        assert "reproduce" in response.suggestion.lower()
    
    async def test_fallback_task_description_feature(self, ai_service_no_key):
        """Test fallback description for feature tasks"""
        title = "Add new feature for user dashboard"
        response = await ai_service_no_key.suggest_task_description(title)
        
        assert response.success is True
        assert response.fallback is True
        assert "feature" in response.suggestion.lower()
        assert "implement" in response.suggestion.lower()
    
    async def test_fallback_task_description_generic(self, ai_service_no_key):
        """Test fallback description for generic tasks"""
        title = "Random task without keywords"
        response = await ai_service_no_key.suggest_task_description(title)
        
        assert response.success is True
        assert response.fallback is True
        assert "detailed requirements" in response.suggestion.lower()
        assert "acceptance criteria" in response.suggestion.lower()
    
    @patch('app.services.ai_service.AsyncOpenAI')
    async def test_openai_task_description_success(self, mock_openai, ai_service_with_key):
        """Test successful OpenAI API call for task description"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "AI generated description"
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        # Patch the service client
        ai_service_with_key.client = mock_client
        
        title = "Implement user authentication"
        response = await ai_service_with_key.suggest_task_description(title, "OAuth integration")
        
        assert response.success is True
        assert response.fallback is False
        assert response.suggestion == "AI generated description"
        mock_client.chat.completions.create.assert_called_once()
    
    @patch('app.services.ai_service.AsyncOpenAI')
    async def test_openai_task_description_failure(self, mock_openai, ai_service_with_key):
        """Test OpenAI API failure falls back gracefully"""
        # Setup mock to raise exception
        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        # Patch the service client
        ai_service_with_key.client = mock_client
        
        title = "Test task"
        response = await ai_service_with_key.suggest_task_description(title)
        
        assert response.success is True
        assert response.fallback is True
        assert "write tests" in response.suggestion.lower()
        assert "test cases" in response.suggestion.lower()


@pytest.mark.asyncio
class TestDailyPlan:
    """Test AI daily plan generation"""
    
    async def test_fallback_daily_plan_empty_tasks(self, ai_service_no_key, mock_user):
        """Test fallback daily plan with no tasks"""
        response = await ai_service_no_key.generate_daily_plan(mock_user, [])
        
        assert response.success is True
        assert response.fallback is True
        assert len(response.tasks) == 0
        assert response.total_estimated_minutes == 0
    
    async def test_fallback_daily_plan_with_tasks(self, ai_service_no_key, mock_user, mock_tasks):
        """Test fallback daily plan with existing tasks"""
        response = await ai_service_no_key.generate_daily_plan(mock_user, mock_tasks)
        
        assert response.success is True
        assert response.fallback is True
        assert len(response.tasks) > 0
        assert response.total_estimated_minutes > 0
        
        # Should prioritize in-progress tasks
        in_progress_tasks = [t for t in response.tasks if t.priority == "high"]
        assert len(in_progress_tasks) > 0
    
    async def test_fallback_daily_plan_time_limits(self, ai_service_no_key, mock_user):
        """Test that fallback daily plan respects time limits"""
        # Create many tasks to test time limiting
        many_tasks = []
        for i in range(10):
            task = MagicMock(spec=Task)
            task.title = f"Task {i}"
            task.description = f"Description {i}"
            task.status = TaskStatus.TODO
            task.total_minutes = 0
            many_tasks.append(task)
        
        response = await ai_service_no_key.generate_daily_plan(mock_user, many_tasks)
        
        assert response.success is True
        assert response.fallback is True
        # Should respect reasonable daily work limits (around 7-8 hours)
        assert response.total_estimated_minutes <= 480  # 8 hours max
    
    @patch('app.services.ai_service.AsyncOpenAI')
    async def test_openai_daily_plan_success(self, mock_openai, ai_service_with_key, mock_user, mock_tasks):
        """Test successful OpenAI API call for daily plan"""
        # Setup mock response
        mock_ai_response = {
            "tasks": [
                {
                    "title": "Priority Task",
                    "estimated_minutes": 120,
                    "priority": "high",
                    "description": "High priority work"
                }
            ],
            "total_estimated_minutes": 120,
            "plan_summary": "Focus on priority task today"
        }
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content = str(mock_ai_response).replace("'", '"')
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        # Patch the service client
        ai_service_with_key.client = mock_client
        
        with patch('json.loads', return_value=mock_ai_response):
            response = await ai_service_with_key.generate_daily_plan(mock_user, mock_tasks)
        
        assert response.success is True
        assert response.fallback is False
        assert len(response.tasks) == 1
        assert response.tasks[0].title == "Priority Task"
        assert response.total_estimated_minutes == 120
        mock_client.chat.completions.create.assert_called_once()
    
    @patch('app.services.ai_service.AsyncOpenAI')
    async def test_openai_daily_plan_failure(self, mock_openai, ai_service_with_key, mock_user, mock_tasks):
        """Test OpenAI API failure falls back gracefully"""
        # Setup mock to raise exception
        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        # Patch the service client
        ai_service_with_key.client = mock_client
        
        response = await ai_service_with_key.generate_daily_plan(mock_user, mock_tasks)
        
        assert response.success is True
        assert response.fallback is True
        assert len(response.tasks) > 0  # Should have fallback tasks
