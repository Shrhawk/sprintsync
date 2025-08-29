from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import time
import uuid

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import auth, users, tasks, ai, stats
from app.db.database import engine, Base
from app.models import User, Task

setup_logging()
logger = structlog.get_logger()

app = FastAPI(
    title="SprintSync API",
    description="Task management with AI assistance for teams",
    version="1.0.0",
    contact={"name": "SprintSync Team", "url": "https://github.com/Shrhawk/sprintsync"},
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    with structlog.contextvars.bound_contextvars(request_id=request_id):
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            user_id = getattr(request.state, "user_id", None)
            
            logger.info(
                "request completed",
                method=request.method,
                path=request.url.path,
                user_id=user_id,
                status_code=response.status_code,
                latency_ms=round(process_time * 1000, 2),
            )
            
            return response
            
        except Exception as exc:
            process_time = time.time() - start_time
            
            logger.error(
                "request failed",
                method=request.method,
                path=request.url.path,
                latency_ms=round(process_time * 1000, 2),
                error=str(exc),
                exc_info=True,
            )
            
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )


@app.on_event("startup")
async def startup_event():
    logger.info("starting api", version="1.0.0", env=settings.ENVIRONMENT)
    
    # Tables should be created via Alembic migrations, not automatic creation
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    
    logger.info("api ready")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("shutting down")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SprintSync API", "version": "1.0.0"}


# routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(ai.router, prefix="/ai", tags=["AI Assistance"])
app.include_router(stats.router, prefix="/stats", tags=["Statistics"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_config=None
    )
