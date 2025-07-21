#!/bin/bash

# Smart Todo Manager Background Service Stopper

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop the service
stop_service() {
    print_status "Stopping Smart Todo Manager background service..."
    
    # Check if PID file exists
    if [ -f ".todo-data/service.pid" ]; then
        SERVICE_PID=$(cat .todo-data/service.pid)
        
        if kill -0 $SERVICE_PID 2>/dev/null; then
            print_status "Stopping process $SERVICE_PID..."
            kill $SERVICE_PID
            
            # Wait for graceful shutdown
            sleep 2
            
            # Force kill if still running
            if kill -0 $SERVICE_PID 2>/dev/null; then
                print_status "Force stopping..."
                kill -9 $SERVICE_PID
            fi
            
            print_success "Service stopped"
        else
            print_status "Process $SERVICE_PID is not running"
        fi
        
        rm -f .todo-data/service.pid
    else
        print_status "No PID file found"
    fi
    
    # Check for any remaining processes
    REMAINING_PIDS=$(pgrep -f "smart-todo.*start" || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        print_status "Stopping remaining processes: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
    
    # Verify service is stopped
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        print_error "Service appears to still be running on port 3001"
        exit 1
    else
        print_success "Smart Todo Manager background service stopped"
    fi
}

# Main execution
main() {
    echo "Smart Todo Manager Background Service Stopper"
    echo "============================================"
    echo
    
    stop_service
}

main "$@"