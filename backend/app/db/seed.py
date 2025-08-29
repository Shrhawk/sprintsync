"""
Database seeding script for SprintSync demo data
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import AsyncSessionLocal, engine
from app.models import Base, User, Task, TaskStatus
from app.core.security import get_password_hash
from app.core.config import settings


async def create_demo_users(db: AsyncSession) -> tuple[User, User]:
    """Create demo admin and regular users"""
    
    # Check if admin user already exists
    result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_FULL_NAME,
            is_admin=True,
        )
        db.add(admin_user)
        print(f"Created admin user: {settings.ADMIN_EMAIL}")
    else:
        print(f"Admin user already exists: {settings.ADMIN_EMAIL}")
    
    # Check if demo user already exists
    result = await db.execute(select(User).where(User.email == settings.DEMO_EMAIL))
    demo_user = result.scalar_one_or_none()
    
    if not demo_user:
        demo_user = User(
            email=settings.DEMO_EMAIL,
            password_hash=get_password_hash(settings.DEMO_PASSWORD),
            full_name=settings.DEMO_FULL_NAME,
            is_admin=False,
        )
        db.add(demo_user)
        print(f"Created demo user: {settings.DEMO_EMAIL}")
    else:
        print(f"Demo user already exists: {settings.DEMO_EMAIL}")
    
    await db.commit()
    await db.refresh(admin_user)
    await db.refresh(demo_user)
    
    return admin_user, demo_user


async def create_demo_tasks(db: AsyncSession, admin_user: User, demo_user: User):
    """Create demo tasks for users"""
    
    # Demo tasks for admin user
    admin_tasks = [
        {
            "title": "Set up CI/CD pipeline",
            "description": "Configure automated testing and deployment pipeline for the SprintSync project. Include unit tests, integration tests, and automated deployment to staging and production environments.",
            "status": TaskStatus.IN_PROGRESS,
            "total_minutes": 120,
        },
        {
            "title": "Review Q4 team performance",
            "description": "Conduct quarterly performance reviews for all team members. Prepare feedback, set goals for next quarter, and schedule one-on-one meetings.",
            "status": TaskStatus.TODO,
            "total_minutes": 0,
        },
        {
            "title": "Update project documentation",
            "description": "Review and update all project documentation including API docs, deployment guides, and team onboarding materials.",
            "status": TaskStatus.DONE,
            "total_minutes": 180,
        },
    ]
    
    # Demo tasks for regular user
    demo_tasks = [
        {
            "title": "Implement user authentication",
            "description": "Build JWT-based authentication system with login, logout, and token refresh functionality. Include password hashing and security best practices.",
            "status": TaskStatus.DONE,
            "total_minutes": 240,
        },
        {
            "title": "Design task management UI",
            "description": "Create responsive React components for task listing, creation, and editing. Focus on clean UX and mobile-friendly design.",
            "status": TaskStatus.IN_PROGRESS,
            "total_minutes": 90,
        },
        {
            "title": "Integrate OpenAI API",
            "description": "Implement AI-powered task suggestions and daily planning features using OpenAI GPT-4 API.",
            "status": TaskStatus.TODO,
            "total_minutes": 0,
        },
        {
            "title": "Write unit tests",
            "description": "Create comprehensive unit tests for all API endpoints and core business logic. Achieve minimum 80% code coverage.",
            "status": TaskStatus.TODO,
            "total_minutes": 0,
        },
        {
            "title": "Optimize database queries",
            "description": "Review and optimize slow database queries. Add proper indexes and implement query result caching where appropriate.",
            "status": TaskStatus.DONE,
            "total_minutes": 75,
        },
    ]
    
    # Create admin tasks
    for task_data in admin_tasks:
        task = Task(
            title=task_data["title"],
            description=task_data["description"],
            status=task_data["status"],
            total_minutes=task_data["total_minutes"],
            user_id=admin_user.id,
        )
        db.add(task)
    
    # Create demo user tasks
    for task_data in demo_tasks:
        task = Task(
            title=task_data["title"],
            description=task_data["description"],
            status=task_data["status"],
            total_minutes=task_data["total_minutes"],
            user_id=demo_user.id,
        )
        db.add(task)
    
    await db.commit()
    print(f"Created {len(admin_tasks)} tasks for admin user")
    print(f"Created {len(demo_tasks)} tasks for demo user")


async def seed_database():
    """Main seeding function"""
    print("🌱 Seeding database with demo data...")
    
    # Tables should already be created via Alembic migrations
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables should be created via migrations")
    
    # Create session
    async with AsyncSessionLocal() as db:
        try:
            # Create demo users
            admin_user, demo_user = await create_demo_users(db)
            
            # Create demo tasks
            await create_demo_tasks(db, admin_user, demo_user)
            
            print("🎉 Database seeding completed successfully!")
            print("\nDemo credentials:")
            print(f"Admin: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
            print(f"Demo:  {settings.DEMO_EMAIL} / {settings.DEMO_PASSWORD}")
            
        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(seed_database())
