import * as fs from 'fs/promises'
import * as path from 'path'
import * as http from 'http'
import { SmartTodoManager } from './SmartTodoManager'
import { SmartTodoConfig } from './types'

interface BackgroundConfig {
  detectInterval: number        // 300000 = 5 minutes
  syncInterval: number         // 900000 = 15 minutes  
  fileWatchEnabled: boolean    // Watch for file changes
  gitWatchEnabled: boolean     // Monitor git repository
  logLevel: 'info' | 'debug' | 'error'   // Logging verbosity
  maxLogFiles: number          // Log rotation
  healthCheckPort: number      // HTTP health endpoint
  projectRoot: string          // Project root directory
}

interface ServiceStats {
  startTime: Date
  lastDetectionRun: Date
  lastSyncRun: Date
  totalDetections: number
  totalCompletions: number
  totalErrors: number
  isHealthy: boolean
  uptime: number
}

export class BackgroundService {
  private config: BackgroundConfig
  private todoManager: SmartTodoManager
  private stats: ServiceStats
  private detectTimer?: NodeJS.Timeout
  private syncTimer?: NodeJS.Timeout
  private fileWatcher?: any
  private healthServer?: http.Server
  private isRunning = false
  private logStream?: any

  constructor(config: BackgroundConfig) {
    this.config = config
    this.stats = {
      startTime: new Date(),
      lastDetectionRun: new Date(0),
      lastSyncRun: new Date(0),
      totalDetections: 0,
      totalCompletions: 0,
      totalErrors: 0,
      isHealthy: true,
      uptime: 0
    }

    const todoConfig: SmartTodoConfig = {
      projectRoot: config.projectRoot,
      futureTodoPath: path.join(config.projectRoot, 'FUTURE_TODO.md'),
      todoDataPath: path.join(config.projectRoot, '.todo-data', 'todos.json'),
      gitEnabled: true,
      autoDetectionEnabled: true,
      syncInterval: config.syncInterval / 60000, // Convert to minutes
      backupEnabled: true,
      maxArchiveSize: 1000
    }

    this.todoManager = new SmartTodoManager(todoConfig)
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('warn', 'Background service is already running')
      return
    }

    try {
      this.log('info', 'Starting Smart Todo Background Service...')
      
      // Initialize todo manager
      await this.todoManager.initialize()
      
      // Set up logging
      await this.setupLogging()
      
      // Start health check server
      await this.startHealthServer()
      
      // Start file watching if enabled
      if (this.config.fileWatchEnabled) {
        await this.startFileWatching()
      }
      
      // Start periodic tasks
      this.startPeriodicTasks()
      
      this.isRunning = true
      this.stats.isHealthy = true
      
      this.log('info', `Smart Todo Background Service started successfully`)
      this.log('info', `Health check available at http://localhost:${this.config.healthCheckPort}/health`)
      this.log('info', `Detection interval: ${this.config.detectInterval / 1000}s`)
      this.log('info', `Sync interval: ${this.config.syncInterval / 1000}s`)
      
    } catch (error) {
      this.log('error', `Failed to start background service: ${error}`)
      this.stats.isHealthy = false
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.log('info', 'Stopping Smart Todo Background Service...')
    
    // Clear timers
    if (this.detectTimer) {
      clearInterval(this.detectTimer)
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    
    // Stop file watcher
    if (this.fileWatcher) {
      await this.fileWatcher.close()
    }
    
    // Stop health server
    if (this.healthServer) {
      this.healthServer.close()
    }
    
    // Close log stream
    if (this.logStream) {
      this.logStream.end()
    }
    
    this.isRunning = false
    this.log('info', 'Smart Todo Background Service stopped')
  }

  private startPeriodicTasks(): void {
    // Completion detection timer
    this.detectTimer = setInterval(async () => {
      await this.runDetectionCycle()
    }, this.config.detectInterval)

    // Sync timer  
    this.syncTimer = setInterval(async () => {
      await this.runSyncCycle()
    }, this.config.syncInterval)

    // Run initial cycles
    setTimeout(() => this.runDetectionCycle(), 5000) // 5 seconds after start
    setTimeout(() => this.runSyncCycle(), 10000) // 10 seconds after start
  }

  private async runDetectionCycle(): Promise<void> {
    try {
      this.log('debug', 'Running completion detection cycle...')
      
      const detections = await this.todoManager.runCompletionDetection()
      this.stats.totalDetections += detections.length
      this.stats.lastDetectionRun = new Date()
      
      let autoCompletions = 0
      for (const detection of detections) {
        if (detection.confidence > 0.8 && detection.suggestedAction === 'mark_completed') {
          await this.todoManager.markTodoCompleted(detection.todoId, `Auto-detected: ${detection.evidence}`)
          autoCompletions++
          this.stats.totalCompletions++
        }
      }
      
      if (detections.length > 0) {
        this.log('info', `Detection cycle completed: ${detections.length} potential completions found, ${autoCompletions} auto-completed`)
      } else {
        this.log('debug', 'Detection cycle completed: no potential completions found')
      }
      
    } catch (error) {
      this.log('error', `Error in detection cycle: ${error}`)
      this.stats.totalErrors++
    }
  }

  private async runSyncCycle(): Promise<void> {
    try {
      this.log('debug', 'Running sync cycle...')
      
      // Sync to FUTURE_TODO.md
      await this.todoManager.syncToFutureTodoMd()
      
      // Generate progress report for logging
      const progress = await this.todoManager.generateProgressReport()
      
      this.stats.lastSyncRun = new Date()
      
      this.log('info', `Sync cycle completed: ${progress.completedTodos}/${progress.totalTodos} todos (${(progress.completionRate * 100).toFixed(1)}%)`)
      
      if (progress.blockedTodos.length > 0) {
        this.log('warn', `${progress.blockedTodos.length} todos are currently blocked`)
      }
      
    } catch (error) {
      this.log('error', `Error in sync cycle: ${error}`)
      this.stats.totalErrors++
    }
  }

  private async startFileWatching(): Promise<void> {
    try {
      const chokidar = await import('chokidar')
      
      // Watch for relevant file changes
      const watchPaths = [
        path.join(this.config.projectRoot, 'src/**/*'),
        path.join(this.config.projectRoot, 'services/**/*'),
        path.join(this.config.projectRoot, 'frontend/**/*'),
        path.join(this.config.projectRoot, '*.md'),
        path.join(this.config.projectRoot, '*.json'),
        path.join(this.config.projectRoot, '*.ts'),
        path.join(this.config.projectRoot, '*.tsx'),
        path.join(this.config.projectRoot, '*.js'),
        path.join(this.config.projectRoot, '*.jsx')
      ]
      
      this.fileWatcher = chokidar.watch(watchPaths, {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/coverage/**',
          '**/.todo-data/**'
        ],
        ignoreInitial: true,
        persistent: true
      })
      
      // Debounce file changes to avoid excessive processing
      let changeTimeout: NodeJS.Timeout | null = null
      
      this.fileWatcher.on('all', (event: string, filePath: string) => {
        if (changeTimeout) {
          clearTimeout(changeTimeout)
        }
        
        changeTimeout = setTimeout(async () => {
          this.log('debug', `File ${event}: ${filePath}`)
          
          // Run quick detection cycle on file changes
          if (event === 'add' || event === 'change') {
            await this.runDetectionCycle()
          }
        }, 2000) // 2 second debounce
      })
      
      this.log('info', 'File watching enabled for relevant project files')
      
    } catch (error) {
      this.log('warn', `Could not enable file watching: ${error}`)
      this.log('info', 'Continuing without file watching...')
    }
  }

  private async startHealthServer(): Promise<void> {
    this.healthServer = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${this.config.healthCheckPort}`)
      
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Content-Type', 'application/json')
      
      if (url.pathname === '/health') {
        this.handleHealthCheck(res)
      } else if (url.pathname === '/stats') {
        this.handleStatsRequest(res)
      } else if (url.pathname === '/progress') {
        this.handleProgressRequest(res)
      } else {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Not found' }))
      }
    })
    
    return new Promise((resolve, reject) => {
      this.healthServer!.listen(this.config.healthCheckPort, (err?: Error) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private handleHealthCheck(res: http.ServerResponse): void {
    this.stats.uptime = Date.now() - this.stats.startTime.getTime()
    
    const health = {
      status: this.stats.isHealthy ? 'healthy' : 'unhealthy',
      uptime: this.stats.uptime,
      lastDetectionRun: this.stats.lastDetectionRun,
      lastSyncRun: this.stats.lastSyncRun,
      totalDetections: this.stats.totalDetections,
      totalCompletions: this.stats.totalCompletions,
      totalErrors: this.stats.totalErrors,
      config: {
        detectInterval: this.config.detectInterval,
        syncInterval: this.config.syncInterval,
        fileWatchEnabled: this.config.fileWatchEnabled
      }
    }
    
    res.statusCode = this.stats.isHealthy ? 200 : 503
    res.end(JSON.stringify(health, null, 2))
  }

  private async handleStatsRequest(res: http.ServerResponse): Promise<void> {
    try {
      const analytics = await this.todoManager.getAnalytics()
      res.statusCode = 200
      res.end(JSON.stringify(analytics, null, 2))
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Failed to get analytics' }))
    }
  }

  private async handleProgressRequest(res: http.ServerResponse): Promise<void> {
    try {
      const progress = await this.todoManager.generateProgressReport()
      res.statusCode = 200
      res.end(JSON.stringify(progress, null, 2))
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Failed to get progress' }))
    }
  }

  private async setupLogging(): Promise<void> {
    const logDir = path.join(this.config.projectRoot, '.todo-data', 'logs')
    await fs.mkdir(logDir, { recursive: true })
    
    const logFile = path.join(logDir, `smart-todo-${new Date().toISOString().split('T')[0]}.log`)
    
    try {
      this.logStream = await fs.open(logFile, 'a')
    } catch (error) {
      console.error('Failed to open log file:', error)
    }
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    // Console output
    if (level === 'error' || this.config.logLevel === 'debug' || 
        (this.config.logLevel === 'info' && level !== 'debug')) {
      console.log(logMessage)
    }
    
    // File output
    if (this.logStream) {
      this.logStream.write(logMessage + '\n').catch(() => {
        // Ignore write errors to avoid infinite loops
      })
    }
  }

  // Public methods for external control
  async forceDetectionRun(): Promise<void> {
    await this.runDetectionCycle()
  }

  async forceSyncRun(): Promise<void> {
    await this.runSyncCycle()
  }

  getStats(): ServiceStats {
    this.stats.uptime = Date.now() - this.stats.startTime.getTime()
    return { ...this.stats }
  }

  isServiceRunning(): boolean {
    return this.isRunning
  }
}

// CLI interface for background service
export async function startBackgroundService(configOverrides: Partial<BackgroundConfig> = {}): Promise<BackgroundService> {
  const defaultConfig: BackgroundConfig = {
    detectInterval: 5 * 60 * 1000,    // 5 minutes
    syncInterval: 15 * 60 * 1000,     // 15 minutes
    fileWatchEnabled: true,
    gitWatchEnabled: true,
    logLevel: 'info',
    maxLogFiles: 7,
    healthCheckPort: 3001,
    projectRoot: process.cwd()
  }
  
  const config = { ...defaultConfig, ...configOverrides }
  const service = new BackgroundService(config)
  
  await service.start()
  
  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\nReceived shutdown signal, gracefully stopping...')
    await service.stop()
    process.exit(0)
  }
  
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  
  return service
}