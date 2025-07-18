#!/bin/bash

# Spontra Development Environment Setup Script
# This script sets up the development environment for Spontra

set -e

echo "🚀 Setting up Spontra development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_tools+=("docker-compose")
    fi
    
    if ! command_exists go; then
        missing_tools+=("go")
    fi
    
    if ! command_exists node; then
        missing_tools+=("node")
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and run this script again."
        exit 1
    fi
    
    log_info "All prerequisites are installed ✓"
}

# Check versions
check_versions() {
    log_info "Checking tool versions..."
    
    # Check Go version
    go_version=$(go version | grep -oE 'go[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+')
    go_major=$(echo $go_version | cut -d. -f1)
    go_minor=$(echo $go_version | cut -d. -f2)
    
    if [ "$go_major" -lt 1 ] || ([ "$go_major" -eq 1 ] && [ "$go_minor" -lt 21 ]); then
        log_warn "Go version $go_version detected. Recommended: 1.21+"
    else
        log_info "Go version $go_version ✓"
    fi
    
    # Check Node version
    node_version=$(node --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    node_major=$(echo $node_version | cut -d. -f1)
    
    if [ "$node_major" -lt 18 ]; then
        log_warn "Node.js version $node_version detected. Recommended: 18+"
    else
        log_info "Node.js version $node_version ✓"
    fi
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        log_info "Created .env file from template"
        log_warn "Please edit .env file with your configuration"
    else
        log_info ".env file already exists"
    fi
    
    # Create directory for logs
    mkdir -p logs
    
    # Create directory for data persistence
    mkdir -p data/{postgres,redis,elasticsearch,cassandra}
}

# Initialize Go modules
init_go_modules() {
    log_info "Initializing Go modules..."
    
    services=("user-service" "search-service" "pricing-service" "data-ingestion-service")
    
    for service in "${services[@]}"; do
        if [ -d "services/$service" ]; then
            cd "services/$service"
            if [ ! -f go.mod ]; then
                go mod init "spontra/$service"
                log_info "Initialized Go module for $service"
            else
                log_info "Go module already exists for $service"
            fi
            cd ../..
        fi
    done
}

# Install frontend dependencies
install_frontend_deps() {
    log_info "Installing frontend dependencies..."
    
    if [ -d "frontend" ]; then
        cd frontend
        if [ ! -d node_modules ]; then
            npm install
            log_info "Installed frontend dependencies"
        else
            log_info "Frontend dependencies already installed"
        fi
        cd ..
    fi
}

# Start development infrastructure
start_infrastructure() {
    log_info "Starting development infrastructure..."
    
    if command_exists docker-compose; then
        docker-compose -f docker/docker-compose.dev.yml up -d
        log_info "Started development infrastructure"
        
        # Wait for services to be ready
        log_info "Waiting for services to be ready..."
        sleep 10
        
        # Check if PostgreSQL is ready
        until docker exec $(docker ps -q -f name=postgres) pg_isready -U spontra; do
            log_info "Waiting for PostgreSQL..."
            sleep 2
        done
        
        log_info "PostgreSQL is ready ✓"
        
        # Check if Redis is ready
        until docker exec $(docker ps -q -f name=redis) redis-cli ping | grep -q PONG; do
            log_info "Waiting for Redis..."
            sleep 2
        done
        
        log_info "Redis is ready ✓"
        
    else
        log_error "docker-compose not found"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if PostgreSQL is running
    if docker exec $(docker ps -q -f name=postgres) pg_isready -U spontra; then
        log_info "Running PostgreSQL migrations..."
        # The init script in docker/postgres/init/ will run automatically
        log_info "Database migrations completed ✓"
    else
        log_error "PostgreSQL is not running"
    fi
}

# Create development scripts
create_dev_scripts() {
    log_info "Creating development scripts..."
    
    # Create start script
    cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "Starting Spontra development environment..."
docker-compose -f docker/docker-compose.dev.yml up -d
echo "Infrastructure started. Run 'make dev' to start services."
EOF
    
    # Create stop script
    cat > scripts/stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Spontra development environment..."
docker-compose -f docker/docker-compose.dev.yml down
echo "Infrastructure stopped."
EOF
    
    # Create reset script
    cat > scripts/reset.sh << 'EOF'
#!/bin/bash
echo "Resetting Spontra development environment..."
docker-compose -f docker/docker-compose.dev.yml down -v
docker-compose -f docker/docker-compose.dev.yml up -d
echo "Environment reset completed."
EOF
    
    chmod +x scripts/*.sh
    log_info "Development scripts created ✓"
}

# Print next steps
print_next_steps() {
    echo ""
    log_info "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start the services:"
    echo "   make dev-up          # Start infrastructure"
    echo "   make start-services  # Start Go services"
    echo "   cd frontend && npm run dev  # Start frontend"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   User Service: http://localhost:8080/health"
    echo "   Search Service: http://localhost:8081/health"
    echo "   Grafana: http://localhost:3001 (admin/admin)"
    echo ""
    echo "Useful commands:"
    echo "   make help           # Show all available commands"
    echo "   make test           # Run all tests"
    echo "   make lint           # Run linters"
    echo "   make logs           # View service logs"
    echo ""
}

# Main execution
main() {
    echo "Spontra Development Setup"
    echo "========================"
    echo ""
    
    check_prerequisites
    check_versions
    setup_environment
    init_go_modules
    install_frontend_deps
    start_infrastructure
    run_migrations
    create_dev_scripts
    print_next_steps
}

# Run main function
main "$@"