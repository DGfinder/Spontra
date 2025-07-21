#!/bin/bash

# Smart Todo Manager Installation Script
# Supports Linux, macOS, and Windows (WSL)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Detect platform
detect_platform() {
    case "$(uname -s)" in
        Linux*)
            if grep -q Microsoft /proc/version 2>/dev/null; then
                PLATFORM="wsl"
            else
                PLATFORM="linux"
            fi
            ;;
        Darwin*)    PLATFORM="macos";;
        CYGWIN*)    PLATFORM="windows";;
        MINGW*)     PLATFORM="windows";;
        *)          PLATFORM="unknown";;
    esac
    
    print_status "Detected platform: $PLATFORM"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 16+."
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_warning "git is not installed. Some features may not work properly."
    else
        print_success "git $(git --version | cut -d' ' -f3) is installed"
    fi
}

# Install Smart Todo Manager
install_smart_todo() {
    print_status "Installing Smart Todo Manager..."
    
    # Install dependencies
    npm install
    
    # Build the project
    npm run build
    
    # Create global symlink
    npm link
    
    print_success "Smart Todo Manager installed successfully!"
}

# Setup systemd service (Linux/WSL)
setup_systemd() {
    if [ "$PLATFORM" != "linux" ] && [ "$PLATFORM" != "wsl" ]; then
        return
    fi
    
    print_status "Setting up systemd service..."
    
    # Get current user and paths
    CURRENT_USER=$(whoami)
    PROJECT_PATH=$(pwd)
    NODE_PATH=$(which node)
    
    # Update service file with correct paths
    sed -i "s|User=ubuntu|User=$CURRENT_USER|g" smart-todo-manager.service
    sed -i "s|Group=ubuntu|Group=$CURRENT_USER|g" smart-todo-manager.service
    sed -i "s|/path/to/your/project/tools/smart-todo-manager|$PROJECT_PATH|g" smart-todo-manager.service
    sed -i "s|/home/ubuntu/.nvm/versions/node/v18.0.0/bin/node|$NODE_PATH|g" smart-todo-manager.service
    sed -i "s|ReadWritePaths=/path/to/your/project|ReadWritePaths=$(dirname $(dirname $PROJECT_PATH))|g" smart-todo-manager.service
    
    # Copy service file to systemd directory (requires sudo)
    if command -v sudo &> /dev/null; then
        sudo cp smart-todo-manager.service /etc/systemd/system/
        sudo systemctl daemon-reload
        print_success "Systemd service installed. Enable with: sudo systemctl enable smart-todo-manager"
        print_status "Start with: sudo systemctl start smart-todo-manager"
        print_status "View logs with: sudo journalctl -u smart-todo-manager -f"
    else
        print_warning "sudo not available. Please manually copy smart-todo-manager.service to /etc/systemd/system/"
    fi
}

# Setup PM2 (all platforms)
setup_pm2() {
    print_status "Setting up PM2 configuration..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        npm install -g pm2
    fi
    
    # Update ecosystem config with correct path
    PROJECT_PATH=$(pwd)
    sed -i "s|script: 'dist/cli.js'|script: '$PROJECT_PATH/dist/cli.js'|g" ecosystem.config.js
    
    print_success "PM2 configuration ready!"
    print_status "Start with: pm2 start ecosystem.config.js"
    print_status "Save PM2 process list: pm2 save"
    print_status "Setup PM2 startup: pm2 startup"
}

# Create directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p .todo-data/logs
    mkdir -p logs
    
    print_success "Directories created"
}

# Initialize in project
initialize_project() {
    read -p "Initialize Smart Todo Manager in the parent project? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Initializing Smart Todo Manager..."
        cd ../..
        npx smart-todo init
        cd tools/smart-todo-manager
        print_success "Smart Todo Manager initialized in project"
    fi
}

# Main installation flow
main() {
    echo "=================================="
    echo "Smart Todo Manager Installation"
    echo "=================================="
    echo
    
    detect_platform
    check_prerequisites
    create_directories
    install_smart_todo
    
    echo
    echo "=================================="
    echo "Background Service Setup"
    echo "=================================="
    echo
    
    case "$PLATFORM" in
        "linux"|"wsl")
            setup_systemd
            setup_pm2
            ;;
        "macos")
            setup_pm2
            print_status "For macOS, consider using launchd for system-level service"
            ;;
        "windows")
            setup_pm2
            print_status "For Windows, consider using NSSM or Windows Service Wrapper"
            ;;
        *)
            setup_pm2
            ;;
    esac
    
    echo
    echo "=================================="
    echo "Project Initialization"
    echo "=================================="
    echo
    
    initialize_project
    
    echo
    echo "=================================="
    echo "Installation Complete!"
    echo "=================================="
    echo
    print_success "Smart Todo Manager is now installed!"
    echo
    echo "Quick start:"
    echo "  1. Manual start:     smart-todo start"
    echo "  2. PM2 start:        pm2 start ecosystem.config.js"
    
    if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "wsl" ]; then
        echo "  3. Systemd start:    sudo systemctl start smart-todo-manager"
    fi
    
    echo "  4. Docker start:     docker-compose up -d"
    echo
    echo "Health check: http://localhost:3001/health"
    echo "Documentation: ./README.md"
    echo
}

# Run main function
main "$@"