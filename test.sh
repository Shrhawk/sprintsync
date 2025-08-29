#!/bin/bash

# SprintSync Test Runner Script
# Runs all backend and frontend tests with coverage

set -e  # Exit on any error

echo "🧪 SprintSync Test Suite"
echo "📊 Generating comprehensive coverage reports..."
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    pip install -r requirements.txt > /dev/null
    
    # Run linting
    print_status "Running backend linting..."
    black --check . || (print_warning "Code formatting issues found. Run 'black .' to fix.")
    isort --check-only . || (print_warning "Import sorting issues found. Run 'isort .' to fix.")
    
    # Run type checking
    print_status "Running type checking..."
    mypy app/ --ignore-missing-imports || print_warning "Type checking issues found"
    
    # Run tests with coverage
    print_status "Running backend tests with coverage..."
    export DATABASE_URL="sqlite+aiosqlite:///:memory:"
    export SECRET_KEY="test-secret-key"
    export ENVIRONMENT="testing"
    
    pytest --cov=app --cov-report=term-missing --cov-report=html:htmlcov || {
        print_error "Backend tests failed"
        cd ..
        exit 1
    }
    
    print_success "Backend tests completed successfully"
    
    cd ..
}

# Frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm ci > /dev/null
    
    # Run linting
    print_status "Running frontend linting..."
    npm run lint || print_warning "Linting issues found"
    
    # Run type checking
    print_status "Running TypeScript type checking..."
    npx tsc --noEmit || print_warning "Type checking issues found"
    
    # Run tests
    print_status "Running frontend tests with coverage..."
    npm run test:coverage || {
        print_error "Frontend tests failed"
        cd ..
        exit 1
    }
    
    print_success "Frontend tests completed successfully"
    
    cd ..
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    echo ""
    echo "📊 Test Coverage Summary"
    echo "========================"
    
    if [ -f "backend/htmlcov/index.html" ]; then
        echo "🐍 Backend coverage report: backend/htmlcov/index.html"
    fi
    
    if [ -f "frontend/coverage/index.html" ]; then
        echo "⚛️  Frontend coverage report: frontend/coverage/index.html"
    fi
    
    echo ""
    print_success "All tests completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "- Review coverage reports for any gaps"
    echo "- Fix any linting or type checking issues"
    echo "- Consider adding more edge case tests"
}

# Main execution
main() {
    check_dependencies
    
    # Allow running specific test suites
    if [ "$1" = "backend" ]; then
        run_backend_tests
    elif [ "$1" = "frontend" ]; then
        run_frontend_tests
    else
        # Run all tests
        run_backend_tests
        run_frontend_tests
        generate_report
    fi
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "SprintSync Test Runner"
    echo ""
    echo "Usage: $0 [backend|frontend|--help]"
    echo ""
    echo "Options:"
    echo "  backend    Run only backend tests"
    echo "  frontend   Run only frontend tests"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Run all tests"
    echo "  $0 backend       # Run only backend tests"
    echo "  $0 frontend      # Run only frontend tests"
    exit 0
fi

# Run main function
main "$@"
