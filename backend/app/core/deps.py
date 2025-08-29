"""
FastAPI dependencies for authentication and database
"""

from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token, create_authentication_error


# HTTP Bearer token security that returns 401 instead of 403

class CustomHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=e.detail,
                    headers={"WWW-Authenticate": "Bearer"}
                )
            raise

security = CustomHTTPBearer()


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user"""
    
    # Verify token
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        raise create_authentication_error()
    
    # Get user from database (user_id is already a string matching VARCHAR(36))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise create_authentication_error()
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user if they are an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    """Get current user if authenticated, otherwise None"""
    if not credentials:
        return None
    
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        return None
    
    # Get user from database (user_id is already a string matching VARCHAR(36))
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
