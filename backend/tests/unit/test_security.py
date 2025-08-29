"""
Unit tests for security utilities
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_password_hashing(self):
        """Test password is properly hashed"""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are long
        assert hashed.startswith("$2b$")  # bcrypt prefix
    
    def test_password_verification_success(self):
        """Test correct password verification"""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test incorrect password verification"""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_different_passwords_different_hashes(self):
        """Test that same password produces different hashes (salt)"""
        password = "test_password_123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        data = {"sub": "user@example.com", "user_id": "test-uuid"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are long
    
    def test_create_token_with_expiry(self):
        """Test JWT token with custom expiry"""
        data = {"sub": "user@example.com"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
    
    @patch('app.core.security.settings.SECRET_KEY', 'test-secret-key')
    def test_verify_valid_token(self):
        """Test verifying a valid JWT token"""
        subject = "test-uuid"  
        token = create_access_token(subject)
        
        user_id = verify_token(token)
        assert user_id is not None
        assert user_id == "test-uuid"  # verify_token returns the subject
    
    def test_verify_invalid_token(self):
        """Test verifying an invalid JWT token"""
        invalid_token = "invalid.jwt.token"
        
        payload = verify_token(invalid_token)
        assert payload is None
    
    def test_verify_expired_token(self):
        """Test verifying an expired JWT token"""
        data = {"sub": "user@example.com"}
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta)
        
        payload = verify_token(token)
        assert payload is None
