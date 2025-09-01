import json
from typing import List, Optional
import structlog
import openai
from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.ai import DailyPlanTask, DailyPlanResponse, AISuggestionResponse
from app.models.task import Task
from app.models.user import User

logger = structlog.get_logger()


class AIService:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            logger.warning("No OpenAI key, using fallbacks")
    
    async def suggest_task_description(self, title: str, context: Optional[str] = None) -> AISuggestionResponse:
        if not self.client:
            return self._fallback_task_description(title)
        try:
            # TODO: maybe make this prompt configurable
            prompt = f"""Create a task description for: "{title}"
{f"Context: {context}" if context else ""}

Include what needs to be done, acceptance criteria, and complexity estimate.
Max 500 words."""

            resp = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful project management assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
            )
            
            suggestion = resp.choices[0].message.content.strip()
            logger.info("generated task description", title=title)
            
            return AISuggestionResponse(
                suggestion=suggestion,
                success=True,
                fallback=False
            )
            
        except Exception as e:
            logger.error("Failed to generate AI task description", error=str(e), title=title)
            return self._fallback_task_description(title)
    
    async def generate_daily_plan(self, user: User, user_tasks: List[Task]) -> DailyPlanResponse:
        if not self.client:
            return self._fallback_daily_plan(user_tasks)
        
        try:
            tasks = [{
                "title": t.title,
                "description": t.description or "No description",
                "status": t.status.value,
                "total_minutes": t.total_minutes
            } for t in user_tasks]
            
            prompt = f"""Plan daily work for {user.full_name}.
Tasks: {json.dumps(tasks)}

Return JSON with:
- tasks: [{{"title", "estimated_minutes", "priority", "description"}}]
- total_estimated_minutes: total
- plan_summary: brief overview

Focus on TODO and IN_PROGRESS. 8 hour max."""

            resp = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
            )
            
            data = json.loads(resp.choices[0].message.content.strip())
            tasks = [DailyPlanTask(**t) for t in data["tasks"]]
            
            return DailyPlanResponse(
                tasks=tasks,
                total_estimated_minutes=data["total_estimated_minutes"],
                plan_summary=data["plan_summary"],
                success=True,
                fallback=False
            )
            
        except Exception as e:
            logger.error("Failed to generate AI daily plan", error=str(e), user_id=user.id)
            return self._fallback_daily_plan(user_tasks)
    
    def _fallback_task_description(self, title: str) -> AISuggestionResponse:
        # basic templates when AI is down
        templates = {
            "bug": "Fix the bug. Reproduce, identify cause, implement fix, test.",
            "feature": "Build the feature. Design, implement, test, document.",
            "refactor": "Clean up code. Analyze current state, refactor incrementally, test.",
            "review": "Review the item. Check requirements, provide feedback.",
            "test": "Write tests. Design test cases, implement, verify coverage.",
        }
        
        title_lower = title.lower()
        for keyword, template in templates.items():
            if keyword in title_lower:
                description = f"{template}\n\nCustomize as needed."
                break
        else:
            description = "Add detailed requirements and acceptance criteria. Break down if complex."
        
        return AISuggestionResponse(
            suggestion=description,
            success=True,
            fallback=True
        )
    
    def _fallback_daily_plan(self, user_tasks: List[Task]) -> DailyPlanResponse:
        # basic plan when AI is down
        todo = [t for t in user_tasks if t.status.value == "TODO"]
        in_progress = [t for t in user_tasks if t.status.value == "IN_PROGRESS"]
        
        tasks = []
        total = 0
        
        # focus on current work first
        for task in in_progress[:2]:
            mins = 120  # 2 hours
            tasks.append(DailyPlanTask(
                title=task.title,
                estimated_minutes=mins,
                priority="high",
                description=f"Continue: {task.description or 'No description'}"
            ))
            total += mins
        
        # add new tasks
        for task in todo[:3]:
            if total >= 420:  # 7 hour max
                break
            mins = 90  # 1.5 hours
            tasks.append(DailyPlanTask(
                title=task.title,
                estimated_minutes=mins,
                priority="medium",
                description=f"Start: {task.description or 'No description'}"
            ))
            total += mins
        
        return DailyPlanResponse(
            tasks=tasks,
            total_estimated_minutes=total,
            plan_summary=f"Focus on {len(in_progress)} current tasks and {len(todo[:3])} new ones. ~{total // 60}h workload.",
            success=True,
            fallback=True
        )


# Global service instance
ai_service = AIService()
