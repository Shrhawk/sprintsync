#!/bin/bash

# SprintSync Development Environment Script

set -e

echo "🚀 Starting SprintSync Development Environment..."
echo "📋 Loading environment variables..."

# Function to clean up on exit
cleanup() {
    echo "🛑 Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
}

# Set up trap to clean up on script exit
trap cleanup EXIT

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file for development..."
    cat > .env << 'EOF'
# SprintSync Development Environment

# Database Configuration
POSTGRES_DB=sprintsync
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/sprintsync

# Backend Configuration
SECRET_KEY=dev-secret-key-change-this-in-production
ENVIRONMENT=development
ALLOWED_HOSTS_STR=http://localhost:3000,http://localhost:8000

# OpenAI Configuration (optional - add your key here)
OPENAI_API_KEY=

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000

# Development Settings
CHOKIDAR_USEPOLLING=true

# AWS CloudWatch Configuration (for logging)
AWS_REGION=us-east-1
AWS_DEFAULT_REGION=us-east-1
# Add your AWS credentials here for CloudWatch logging (optional for local dev)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
EOF
    echo "✅ .env file created for development. Add your OPENAI_API_KEY and AWS credentials if needed."
fi

# Check if CloudWatch logging is desired
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "🔍 AWS credentials detected. CloudWatch logging will be enabled."
    echo "📊 To setup CloudWatch log groups, run: ./scripts/setup-cloudwatch-dev.sh"
    
    # Export AWS credentials for Docker logging
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY
    export AWS_REGION
else
    echo "⚠️  AWS credentials not found. CloudWatch logging will be disabled."
    echo "💡 To enable CloudWatch logging:"
    echo "   1. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env file"
    echo "   2. Run: ./scripts/setup-cloudwatch-dev.sh"
    echo "   3. Restart this script"
fi

# Start the development environment
echo "🔧 Starting services with live reload..."
docker-compose -f docker-compose.dev.yml up --build

# Keep the script running
wait
