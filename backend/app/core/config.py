from typing import List
from pydantic_settings import BaseSettings
from pydantic import computed_field


class Settings(BaseSettings):
    
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SprintSync"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # auth stuff
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION_USE_openssl_rand_hex_32"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/sprintsync"  # Will be overridden by env var
    
    # cors hosts
    ALLOWED_HOSTS_STR: str = "http://localhost:3000,http://localhost:8000"
    
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 1000
    OPENAI_TEMPERATURE: float = 0.7
    
    # default users
    ADMIN_EMAIL: str = "admin@sprintsync.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_FULL_NAME: str = "Admin User"
    
    DEMO_EMAIL: str = "demo@sprintsync.com"
    DEMO_PASSWORD: str = "demo123"
    DEMO_FULL_NAME: str = "Demo User"
    
    @computed_field
    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS_STR.split(",") if host.strip()]
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()
