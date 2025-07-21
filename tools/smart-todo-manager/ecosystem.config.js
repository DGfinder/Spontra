module.exports = {
  apps: [{
    name: 'smart-todo-manager',
    script: 'dist/cli.js',
    args: 'start --detect-interval 5 --sync-interval 15 --port 3001 --log-level info',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Restart policy
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Advanced PM2 features
    exec_mode: 'fork',
    listen_timeout: 8000,
    kill_timeout: 5000,
    
    // Health monitoring
    health_check_url: 'http://localhost:3001/health',
    health_check_grace_period: 3000,
    
    // Environment-specific configurations
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    
    env_staging: {
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info'
    },
    
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  }]
}