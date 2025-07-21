#!/usr/bin/env node

import { Command } from 'commander'
import * as path from 'path'
import { SmartTodoManager } from './SmartTodoManager'
import { Todo, SmartTodoConfig } from './types'
import { startBackgroundService } from './BackgroundService'

const program = new Command()

// Default configuration
function getDefaultConfig(): SmartTodoConfig {
  const projectRoot = process.cwd()
  
  return {
    projectRoot,
    futureTodoPath: path.join(projectRoot, 'FUTURE_TODO.md'),
    todoDataPath: path.join(projectRoot, '.todo-data', 'todos.json'),
    gitEnabled: true,
    autoDetectionEnabled: true,
    syncInterval: 60,
    backupEnabled: true,
    maxArchiveSize: 1000
  }
}

async function createTodoManager(configOverrides: Partial<SmartTodoConfig> = {}): Promise<SmartTodoManager> {
  const config = { ...getDefaultConfig(), ...configOverrides }
  const todoManager = new SmartTodoManager(config)
  await todoManager.initialize()
  return todoManager
}

program
  .name('smart-todo')
  .description('Smart Todo Manager - Intelligent todo tracking and completion detection')
  .version('1.0.0')

// Sync session todos command
program
  .command('sync')
  .description('Sync session todos with project todos')
  .option('-s, --session <file>', 'Session todos file (JSON format)')
  .option('-f, --format <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      
      let sessionTodos: Todo[] = []
      
      if (options.session) {
        const sessionData = await import(path.resolve(options.session))
        sessionTodos = sessionData.default || sessionData
      }
      
      const result = await todoManager.syncSessionTodos(sessionTodos)
      
      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log('📋 Sync Results:')
        console.log(`  ✅ Added: ${result.added.length} todos`)
        console.log(`  🔄 Updated: ${result.updated.length} todos`)
        console.log(`  ✅ Completed: ${result.completed.length} todos`)
        console.log(`  ⚠️  Conflicts: ${result.conflicts.length} todos`)
        
        if (result.conflicts.length > 0) {
          console.log('\n🔍 Conflicts:')
          for (const conflict of result.conflicts) {
            console.log(`  - ${conflict.todoId}: ${conflict.type}`)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error syncing todos:', error)
      process.exit(1)
    }
  })

// Detect completions command
program
  .command('detect')
  .description('Run completion detection on pending todos')
  .option('-a, --auto-complete', 'Automatically complete high-confidence detections')
  .option('-t, --threshold <number>', 'Confidence threshold for auto-completion', '0.9')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      const results = await todoManager.runCompletionDetection()
      
      console.log(`🎯 Found ${results.length} potential completions:`)
      
      for (const result of results) {
        const confidence = (result.confidence * 100).toFixed(0)
        const emoji = result.confidence > 0.9 ? '🎯' : result.confidence > 0.7 ? '👀' : '🤔'
        
        console.log(`${emoji} ${result.evidence} (${confidence}% confidence)`)
        
        if (options.autoComplete && result.confidence >= parseFloat(options.threshold)) {
          if (result.suggestedAction === 'mark_completed') {
            await todoManager.markTodoCompleted(result.todoId, `Auto-detected: ${result.evidence}`)
            console.log(`  ✅ Automatically marked as completed`)
          }
        }
      }
      
      if (results.length === 0) {
        console.log('No potential completions detected.')
      }
    } catch (error) {
      console.error('❌ Error detecting completions:', error)
      process.exit(1)
    }
  })

// Progress report command
program
  .command('progress')
  .description('Generate progress report')
  .option('-f, --format <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      const progress = await todoManager.generateProgressReport()
      
      if (options.format === 'json') {
        console.log(JSON.stringify(progress, null, 2))
      } else {
        console.log('📊 Progress Report:')
        console.log(`  📋 Total todos: ${progress.totalTodos}`)
        console.log(`  ✅ Completed: ${progress.completedTodos} (${(progress.completionRate * 100).toFixed(1)}%)`)
        console.log(`  ⚡ Velocity: ${progress.velocity} todos/week`)
        console.log(`  📅 Estimated completion: ${progress.estimatedCompletion.toDateString()}`)
        
        if (progress.blockedTodos.length > 0) {
          console.log(`\n⛔ Blocked todos (${progress.blockedTodos.length}):`)
          for (const todo of progress.blockedTodos.slice(0, 5)) {
            console.log(`  - ${todo.content}`)
          }
        }
        
        if (progress.upcomingTodos.length > 0) {
          console.log(`\n🔜 Upcoming high-priority todos:`)
          for (const todo of progress.upcomingTodos.slice(0, 5)) {
            const priority = todo.priority.toUpperCase()
            console.log(`  - [${priority}] ${todo.content}`)
          }
        }
        
        if (progress.recentlyCompleted.length > 0) {
          console.log(`\n🎉 Recently completed:`)
          for (const todo of progress.recentlyCompleted.slice(0, 5)) {
            const date = todo.completedAt?.toLocaleDateString() || 'Unknown'
            console.log(`  - ${todo.content} (${date})`)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error generating progress report:', error)
      process.exit(1)
    }
  })

// Analytics command
program
  .command('analytics')
  .description('Generate todo analytics and insights')
  .option('-f, --format <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      const analytics = await todoManager.getAnalytics()
      
      if (options.format === 'json') {
        console.log(JSON.stringify(analytics, null, 2))
      } else {
        console.log('📈 Todo Analytics:')
        
        // Category breakdown
        console.log('\n📂 Category Breakdown:')
        for (const category of analytics.categoryBreakdown) {
          const rate = category.total > 0 ? (category.completed / category.total * 100).toFixed(0) : '0'
          console.log(`  ${category.category}: ${category.completed}/${category.total} (${rate}%)`)
        }
        
        // Priority distribution
        console.log('\n🎯 Priority Distribution:')
        for (const priority of analytics.priorityDistribution) {
          console.log(`  ${priority.priority.toUpperCase()}: ${priority.count} todos`)
        }
        
        // Bottlenecks
        if (analytics.bottlenecks.length > 0) {
          console.log('\n🚧 Bottlenecks:')
          for (const bottleneck of analytics.bottlenecks.slice(0, 3)) {
            console.log(`  ${bottleneck.reason}: ${bottleneck.count} affected todos`)
          }
        }
        
        // Recent velocity
        const recentVelocity = analytics.velocityHistory.slice(-4)
        const avgVelocity = recentVelocity.reduce((sum, week) => sum + week.completed, 0) / recentVelocity.length
        console.log(`\n⚡ Average velocity (last 4 weeks): ${avgVelocity.toFixed(1)} todos/week`)
        
        // Time accuracy
        if (analytics.timeAccuracy.length > 0) {
          const avgAccuracy = analytics.timeAccuracy.reduce((sum, item) => sum + item.accuracy, 0) / analytics.timeAccuracy.length
          console.log(`⏱️  Average time estimation accuracy: ${avgAccuracy.toFixed(1)}%`)
        }
      }
    } catch (error) {
      console.error('❌ Error generating analytics:', error)
      process.exit(1)
    }
  })

// Suggestions command
program
  .command('suggest')
  .description('Get smart todo suggestions based on current context')
  .option('-f, --files <files>', 'Current file context (comma-separated)')
  .option('-n, --count <number>', 'Number of suggestions', '5')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      
      const context = options.files ? {
        filePaths: options.files.split(',').map((f: string) => f.trim())
      } : undefined
      
      const suggestions = await todoManager.getSmartSuggestions(context)
      
      console.log(`💡 Smart Suggestions (${suggestions.length}):`)
      
      if (suggestions.length === 0) {
        console.log('No suggestions available. All high-priority todos may be completed or blocked.')
        return
      }
      
      for (let i = 0; i < Math.min(suggestions.length, parseInt(options.count)); i++) {
        const todo = suggestions[i]
        const priority = todo.priority.toUpperCase()
        console.log(`${i + 1}. [${priority}] ${todo.content}`)
        
        if (todo.estimatedHours) {
          console.log(`   ⏱️  Estimated: ${todo.estimatedHours}h`)
        }
        
        if (context?.filePaths && todo.filePaths) {
          const relevantFiles = todo.filePaths.filter(file => 
            context.filePaths!.some((contextFile: string) => 
              file.includes(contextFile) || contextFile.includes(file)
            )
          )
          if (relevantFiles.length > 0) {
            console.log(`   📁 Related files: ${relevantFiles.join(', ')}`)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error getting suggestions:', error)
      process.exit(1)
    }
  })

// Mark complete command
program
  .command('complete <todoId>')
  .description('Mark a todo as completed')
  .option('-r, --reason <reason>', 'Reason for completion')
  .action(async (todoId, options) => {
    try {
      const todoManager = await createTodoManager()
      const completedTodo = await todoManager.markTodoCompleted(todoId, options.reason)
      
      console.log(`✅ Marked todo as completed: ${completedTodo.content}`)
      
      if (options.reason) {
        console.log(`📝 Reason: ${options.reason}`)
      }
    } catch (error) {
      console.error('❌ Error marking todo as completed:', error)
      process.exit(1)
    }
  })

// Initialize command
program
  .command('init')
  .description('Initialize smart todo manager in current project')
  .option('--git-hooks', 'Set up git hooks for automatic detection', true)
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      
      if (options.gitHooks) {
        const gitIntegration = (todoManager as any).gitIntegration
        await gitIntegration.setupHooks()
        await gitIntegration.createDetectionScript()
        console.log('✅ Git hooks set up successfully')
      }
      
      console.log('✅ Smart Todo Manager initialized!')
      console.log('\nNext steps:')
      console.log('1. Add todos to FUTURE_TODO.md or use session todos')
      console.log('2. Run `smart-todo sync` to sync session todos')
      console.log('3. Run `smart-todo detect` to check for completions')
      console.log('4. Run `smart-todo progress` to see your progress')
    } catch (error) {
      console.error('❌ Error initializing:', error)
      process.exit(1)
    }
  })

// List command
program
  .command('list')
  .description('List all todos with filtering options')
  .option('-s, --status <status>', 'Filter by status (pending|in_progress|completed|blocked)')
  .option('-p, --priority <priority>', 'Filter by priority (low|medium|high|critical)')
  .option('-c, --category <category>', 'Filter by category')
  .option('-l, --limit <number>', 'Limit number of results', '20')
  .action(async (options) => {
    try {
      const todoManager = await createTodoManager()
      const projectTodos = (todoManager as any).projectTodos
      
      let todos = [...projectTodos.projectTodos, ...projectTodos.archivedTodos]
      
      // Apply filters
      if (options.status) {
        todos = todos.filter(t => t.status === options.status)
      }
      
      if (options.priority) {
        todos = todos.filter(t => t.priority === options.priority)
      }
      
      if (options.category) {
        todos = todos.filter(t => t.category === options.category)
      }
      
      // Sort by priority and date
      todos.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
      
      // Apply limit
      todos = todos.slice(0, parseInt(options.limit))
      
      console.log(`📋 Todos (${todos.length} results):`)
      
      for (const todo of todos) {
        const status = todo.status === 'completed' ? '✅' : 
                      todo.status === 'in_progress' ? '🔄' :
                      todo.status === 'blocked' ? '⛔' : '⏳'
        
        const priority = todo.priority.toUpperCase()
        const category = todo.category ? `[${todo.category}]` : ''
        
        console.log(`${status} [${priority}] ${category} ${todo.content}`)
        console.log(`   ID: ${todo.id} | Updated: ${todo.updatedAt.toLocaleDateString()}`)
        
        if (todo.estimatedHours) {
          console.log(`   ⏱️  Estimated: ${todo.estimatedHours}h`)
        }
      }
      
      if (todos.length === 0) {
        console.log('No todos found matching the criteria.')
      }
    } catch (error) {
      console.error('❌ Error listing todos:', error)
      process.exit(1)
    }
  })

// Background service command
program
  .command('start')
  .description('Start Smart Todo Manager background service')
  .option('--detect-interval <minutes>', 'Detection interval in minutes', '5')
  .option('--sync-interval <minutes>', 'Sync interval in minutes', '15')
  .option('--port <port>', 'Health check port', '3001')
  .option('--no-file-watch', 'Disable file watching')
  .option('--log-level <level>', 'Log level (info|debug|error)', 'info')
  .action(async (options) => {
    try {
      console.log('🚀 Starting Smart Todo Manager background service...')
      
      const config = {
        detectInterval: parseInt(options.detectInterval) * 60 * 1000,
        syncInterval: parseInt(options.syncInterval) * 60 * 1000,
        healthCheckPort: parseInt(options.port),
        fileWatchEnabled: !options.noFileWatch,
        logLevel: options.logLevel as 'info' | 'debug' | 'error',
        projectRoot: process.cwd()
      }
      
      const service = await startBackgroundService(config)
      
      console.log('✅ Background service started successfully!')
      console.log(`🏥 Health check: http://localhost:${config.healthCheckPort}/health`)
      console.log('📊 Stats endpoint: http://localhost:${config.healthCheckPort}/stats')
      console.log('📈 Progress endpoint: http://localhost:${config.healthCheckPort}/progress')
      console.log('\n🛑 Press Ctrl+C to stop the service')
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping background service...')
        process.exit(0)
      })
      
    } catch (error) {
      console.error('❌ Failed to start background service:', error)
      process.exit(1)
    }
  })

// Error handling
program.exitOverride()

try {
  program.parse()
} catch (error) {
  console.error('❌ Command failed:', error)
  process.exit(1)
}

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp()
}