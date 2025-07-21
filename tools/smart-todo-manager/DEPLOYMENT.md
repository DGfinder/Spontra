# Smart Todo Manager - Deployment Guide

This guide covers different ways to run the Smart Todo Manager background service automatically.

## Quick Start

### 1. One-command Installation
```bash
./scripts/install.sh
```

### 2. Simple Background Start
```bash
npm run start:background
```

### 3. Check Service Status
```bash
npm run health
```

## Deployment Options

### 🔧 Option 1: Simple Background Process (Recommended for Development)

**Start the service:**
```bash
npm run start:background
# or
./scripts/start-background.sh
```

**Stop the service:**
```bash
npm run stop:background
# or 
./scripts/stop-background.sh
```

**Monitor:**
```bash
tail -f .todo-data/logs/background-service.log
```

### 📦 Option 2: PM2 Process Manager (Recommended for Production)

**Install PM2:**
```bash
npm install -g pm2
```

**Start with PM2:**
```bash
npm run pm2:start
# or
pm2 start ecosystem.config.js
```

**Manage PM2 service:**
```bash
pm2 list                    # List processes
pm2 logs smart-todo-manager # View logs
pm2 restart smart-todo-manager # Restart
pm2 stop smart-todo-manager # Stop
pm2 delete smart-todo-manager # Remove
```

**Save PM2 configuration:**
```bash
pm2 save                    # Save current process list
pm2 startup                 # Generate startup script
```

### 🐧 Option 3: Systemd Service (Linux/WSL)

**Install systemd service:**
```bash
# Update paths in smart-todo-manager.service first
sudo cp smart-todo-manager.service /etc/systemd/system/
sudo systemctl daemon-reload
```

**Manage systemd service:**
```bash
sudo systemctl enable smart-todo-manager  # Enable auto-start
sudo systemctl start smart-todo-manager   # Start service
sudo systemctl status smart-todo-manager  # Check status
sudo systemctl stop smart-todo-manager    # Stop service
```

**View systemd logs:**
```bash
sudo journalctl -u smart-todo-manager -f
```

### 🐳 Option 4: Docker Container

**Build and run with Docker Compose:**
```bash
npm run docker:run
# or
docker-compose up -d
```

**Manage Docker service:**
```bash
docker-compose ps           # Check status
docker-compose logs -f      # View logs
docker-compose restart      # Restart
docker-compose down         # Stop and remove
```

**Build custom image:**
```bash
npm run docker:build
# or
docker build -t smart-todo-manager .
```

### 🍎 Option 5: macOS launchd (macOS)

Create a launchd plist file:
```bash
cat > ~/Library/LaunchAgents/com.spontra.smart-todo-manager.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.spontra.smart-todo-manager</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(pwd)/dist/cli.js</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$(pwd)/.todo-data/logs/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/.todo-data/logs/launchd-error.log</string>
</dict>
</plist>
EOF
```

Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.spontra.smart-todo-manager.plist
```

### 🪟 Option 6: Windows Service (Windows)

Using NSSM (Non-Sucking Service Manager):

**Install NSSM:**
```bash
# Download from https://nssm.cc/
# Or via Chocolatey: choco install nssm
```

**Create Windows service:**
```bash
nssm install SmartTodoManager
# Set Application Path: C:\path\to\node.exe
# Set Startup Directory: C:\path\to\smart-todo-manager
# Set Arguments: dist/cli.js start
```

## Configuration

### Environment Variables

```bash
# Service configuration
SMART_TODO_DETECT_INTERVAL=300000    # 5 minutes in milliseconds
SMART_TODO_SYNC_INTERVAL=900000      # 15 minutes in milliseconds
SMART_TODO_HEALTH_PORT=3001          # Health check port
SMART_TODO_LOG_LEVEL=info            # info, debug, error
SMART_TODO_PROJECT_ROOT=/path/to/project

# Feature toggles
SMART_TODO_FILE_WATCH=true           # Enable file watching
SMART_TODO_GIT_WATCH=true            # Enable git monitoring
```

### Service Configuration Options

```bash
# Start with custom configuration
smart-todo start \
  --detect-interval 10 \     # Detection every 10 minutes
  --sync-interval 30 \       # Sync every 30 minutes
  --port 3002 \             # Custom health check port
  --log-level debug \       # Debug logging
  --no-file-watch          # Disable file watching
```

## Monitoring

### Health Check Endpoints

**Service Health:**
```bash
curl http://localhost:3001/health
# Returns: service status, uptime, last runs, error counts
```

**Detailed Statistics:**
```bash
curl http://localhost:3001/stats
# Returns: comprehensive analytics and insights
```

**Current Progress:**
```bash
curl http://localhost:3001/progress
# Returns: todo completion progress and velocity
```

### Log Files

```bash
# Background service logs
tail -f .todo-data/logs/smart-todo-$(date +%Y-%m-%d).log

# PM2 logs
pm2 logs smart-todo-manager

# Systemd logs
sudo journalctl -u smart-todo-manager -f

# Docker logs
docker-compose logs -f
```

## Performance Tuning

### Memory Usage
- Expected: 50-100MB RAM
- Limit in Docker: 256MB
- PM2 restart threshold: 200MB

### CPU Usage
- Expected: <5% during detection cycles
- Docker CPU limit: 50%
- Detection frequency: adjustable via `--detect-interval`

### File Watching
- Watches: `src/`, `services/`, `frontend/`, `*.md`, `*.json`, `*.ts`
- Excludes: `node_modules/`, `dist/`, `build/`, `.git/`
- Debounce: 2 seconds to avoid excessive processing

## Troubleshooting

### Common Issues

**Port 3001 already in use:**
```bash
# Find process using port
lsof -i :3001
# Kill process or use different port
smart-todo start --port 3002
```

**Service not detecting completions:**
```bash
# Check git repository status
git status
# Manually trigger detection
smart-todo detect
# Check logs for errors
tail -f .todo-data/logs/smart-todo-$(date +%Y-%m-%d).log
```

**High memory usage:**
```bash
# Check analytics for large data sets
smart-todo analytics
# Clear old archives if needed
# Restart service
```

### Debug Mode

```bash
# Start with debug logging
smart-todo start --log-level debug

# Run manual detection with verbose output
smart-todo detect --auto-complete --threshold 0.8
```

## Best Practices

### 1. **Choose the Right Deployment Method**
- **Development**: Simple background process or PM2
- **Production**: Systemd (Linux) or Docker
- **CI/CD**: Docker containers
- **Local development**: PM2 with auto-restart

### 2. **Resource Management**
- Monitor memory usage with health checks
- Adjust detection intervals based on project activity
- Use file watching for active development, disable for CI

### 3. **Security**
- Run as non-root user (especially with systemd)
- Use read-only mounts in Docker where possible
- Limit network access to health check port only

### 4. **Backup and Recovery**
- `.todo-data/` directory contains all persistent data
- Regular backups included in service
- Archive old completed todos automatically

### 5. **Integration**
- Health checks for monitoring systems
- Log aggregation for centralized monitoring
- Metrics export for dashboards

## Advanced Configuration

### Custom Detection Patterns

```typescript
// In SmartTodoConfig
completionPatterns: [
  {
    type: 'commit_message',
    pattern: /implement.*auth/i,
    confidence: 0.9
  },
  {
    type: 'file_creation',
    pattern: /.*Service\.ts$/,
    confidence: 0.8
  }
]
```

### Multi-Project Setup

```bash
# Run multiple instances for different projects
smart-todo start --port 3001 --project-root /project1
smart-todo start --port 3002 --project-root /project2
```

### Load Balancing

For high-throughput environments, consider running multiple instances behind a load balancer with different project roots or detection intervals.

## Support

For issues or questions:
1. Check the logs first
2. Verify configuration with health check
3. Test manual detection: `smart-todo detect`
4. Review the main README.md for API documentation
5. Submit issues to the project repository