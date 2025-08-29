"""
Integration tests for AI API endpoints
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.models.user import User
from app.models.task import Task, TaskStatus


@pytest.mark.integration
class TestAIEndpoints:
    """Test AI assistance API endpoints"""
    
    @pytest.mark.asyncio
    async def test_suggest_description_success(self, client: AsyncClient, auth_headers: dict, mock_ai_service):
        """Test AI task description suggestion"""
        request_data = {
            "title": "Implement user authentication",
            "context": "OAuth 2.0 integration"
        }
        
        response = await client.post("/ai/suggest-description", json=request_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data
        assert data["success"] is True
        assert isinstance(data["fallback"], bool)
    
    @pytest.mark.asyncio
    async def test_suggest_description_unauthorized(self, client: AsyncClient):
        """Test AI suggestion without authentication"""
        request_data = {
            "title": "Test task",
        }
        
        response = await client.post("/ai/suggest-description", json=request_data)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_suggest_description_invalid_data(self, client: AsyncClient, auth_headers: dict):
        """Test AI suggestion with invalid data"""
        request_data = {
            "title": "",  # Empty title
        }
        
        response = await client.post("/ai/suggest-description", json=request_data, headers=auth_headers)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_get_daily_plan_success(self, client: AsyncClient, auth_headers: dict, test_task: Task, mock_ai_service):
        """Test AI daily plan generation"""
        response = await client.get("/ai/daily-plan", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "total_estimated_minutes" in data
        assert "plan_summary" in data
        assert data["success"] is True
        assert isinstance(data["fallback"], bool)
    
    @pytest.mark.asyncio
    async def test_get_daily_plan_unauthorized(self, client: AsyncClient):
        """Test daily plan without authentication"""
        response = await client.get("/ai/daily-plan")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_daily_plan_with_multiple_tasks(self, client: AsyncClient, auth_headers: dict, db_session, test_user: User, mock_ai_service):
        """Test daily plan generation with multiple tasks"""
        # Create multiple tasks for the user
        tasks = [
            Task(
                title=f"Task {i}",
                description=f"Description {i}",
                status=TaskStatus.TODO if i % 2 == 0 else TaskStatus.IN_PROGRESS,
                total_minutes=30 * i,
                user_id=test_user.id,
            )
            for i in range(1, 4)
        ]
        
        for task in tasks:
            db_session.add(task)
        await db_session.commit()
        
        response = await client.get("/ai/daily-plan", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks"]) >= 1
        assert data["total_estimated_minutes"] > 0
    
    @patch('app.services.ai_service.ai_service.client', None)
    @pytest.mark.asyncio
    async def test_ai_endpoints_fallback_mode(self, client: AsyncClient, auth_headers: dict):
        """Test AI endpoints work in fallback mode (no API key)"""
        # Test description suggestion fallback
        request_data = {
            "title": "Fix bug in payment system",
        }
        
        response = await client.post("/ai/suggest-description", json=request_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["fallback"] is True
        assert "bug" in data["suggestion"].lower()
        
        # Test daily plan fallback
        response = await client.get("/ai/daily-plan", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["fallback"] is True
