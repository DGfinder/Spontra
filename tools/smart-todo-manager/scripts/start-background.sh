#!/bin/bash

# Smart Todo Manager Background Service Starter
# Simple script to start the background service with common configurations

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if the service is already running
check_running() {
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        print_warning "Smart Todo Manager is already running on port 3001"
        echo "Health check: http://localhost:3001/health"
        echo "Stats: http://localhost:3001/stats"
        echo "Progress: http://localhost:3001/progress"
        exit 0
    fi
}

# Start the service
start_service() {
    print_status "Starting Smart Todo Manager background service..."
    
    # Build if needed
    if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
        print_status "Building project..."
        npm run build
    fi
    
    # Start with nohup for background operation
    nohup node dist/cli.js start \
        --detect-interval 5 \
        --sync-interval 15 \
        --port 3001 \
        --log-level info \
        > .todo-data/logs/background-service.log 2>&1 &
    
    SERVICE_PID=$!
    echo $SERVICE_PID > .todo-data/service.pid
    
    # Wait a moment for startup
    sleep 3
    
    # Check if it started successfully
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Smart Todo Manager started successfully!"
        echo "  PID: $SERVICE_PID"
        echo "  Health check: http://localhost:3001/health"
        echo "  Logs: tail -f .todo-data/logs/background-service.log"
        echo "  Stop: kill $SERVICE_PID"
    else
        print_error "Failed to start service. Check logs:"
        cat .todo-data/logs/background-service.log
        exit 1
    fi
}

# Main execution
main() {
    echo "Smart Todo Manager Background Service Starter"
    echo "============================================"
    echo
    
    check_running
    start_service
    
    echo
    echo "Service is now running in the background."
    echo "It will automatically detect todo completions and sync progress."
}

main "$@"