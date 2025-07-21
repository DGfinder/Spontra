import { SmartTodoManager } from './SmartTodoManager'
import { Todo, SmartTodoConfig } from './types'
import * as path from 'path'

/**
 * Integration layer between Claude Code's TodoWrite tool and Smart Todo Manager
 * This provides enhanced todo management capabilities for Claude Code sessions
 */
export class ClaudeCodeIntegration {
  private todoManager: SmartTodoManager | null = null
  private sessionTodos: Todo[] = []
  private isInitialized = false

  async initialize(projectRoot?: string): Promise<void> {
    const root = projectRoot || process.cwd()
    
    const config: SmartTodoConfig = {
      projectRoot: root,
      futureTodoPath: path.join(root, 'FUTURE_TODO.md'),
      todoDataPath: path.join(root, '.todo-data', 'todos.json'),
      gitEnabled: true,
      autoDetectionEnabled: true,
      syncInterval: 60,
      backupEnabled: true,
      maxArchiveSize: 1000
    }

    this.todoManager = new SmartTodoManager(config)
    await this.todoManager.initialize()
    this.isInitialized = true
  }

  /**
   * Enhanced TodoWrite that integrates with Smart Todo Manager
   */
  async writeSmartTodos(todos: Array<{
    content: string
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    id: string
  }>): Promise<{
    todos: Todo[]
    syncResult?: any
    suggestions?: Todo[]
    progress?: any
  }> {
    if (!this.isInitialized || !this.todoManager) {
      await this.initialize()
    }

    // Convert TodoWrite format to Smart Todo format
    const smartTodos: Todo[] = todos.map(todo => ({
      ...todo,
      priority: todo.priority as 'low' | 'medium' | 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'session',
      tags: ['claude-code', 'session'],
      completionPatterns: (this.todoManager as any).completionDetector?.generateCompletionPatterns({
        content: todo.content,
        id: todo.id,
        status: todo.status,
        priority: todo.priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }) || []
    }))

    this.sessionTodos = smartTodos

    // Sync with project todos
    const syncResult = await this.todoManager!.syncSessionTodos(smartTodos)

    // Get smart suggestions for next work
    const suggestions = await this.todoManager!.getSmartSuggestions({
      filePaths: await this.getCurrentFileContext()
    })

    // Get progress update
    const progress = await this.todoManager!.generateProgressReport()

    return {
      todos: smartTodos,
      syncResult,
      suggestions: suggestions.slice(0, 3),
      progress
    }
  }

  /**
   * Get contextual todo suggestions for Claude Code
   */
  async getContextualSuggestions(currentFiles?: string[]): Promise<{
    suggestions: Todo[]
    insights: string[]
    upcomingDeadlines: Todo[]
  }> {
    if (!this.todoManager) {
      return { suggestions: [], insights: [], upcomingDeadlines: [] }
    }

    const context = currentFiles ? { filePaths: currentFiles } : undefined
    const suggestions = await this.todoManager.getSmartSuggestions(context)
    
    const analytics = await this.todoManager.getAnalytics()
    const insights = (this.todoManager as any).analyticsEngine.generateInsights(analytics)
    
    // Get upcoming high-priority todos as "deadlines"
    const progress = await this.todoManager.generateProgressReport()
    const upcomingDeadlines = progress.upcomingTodos.filter(t => 
      t.priority === 'high' || t.priority === 'critical'
    ).slice(0, 5)

    return {
      suggestions: suggestions.slice(0, 5),
      insights: insights.slice(0, 3),
      upcomingDeadlines
    }
  }

  /**
   * Mark a todo as completed with automatic detection
   */
  async completeTodo(todoId: string, evidence?: string): Promise<{
    completedTodo: Todo
    detectedCompletions: any[]
    updatedProgress: any
  }> {
    if (!this.todoManager) {
      throw new Error('Smart Todo Manager not initialized')
    }

    const completedTodo = await this.todoManager.markTodoCompleted(todoId, evidence)
    
    // Run completion detection to find other potentially completed todos
    const detectedCompletions = await this.todoManager.runCompletionDetection()
    
    // Get updated progress
    const updatedProgress = await this.todoManager.generateProgressReport()

    return {
      completedTodo,
      detectedCompletions,
      updatedProgress
    }
  }

  /**
   * Promote session todos to project-level tracking
   */
  async promoteToProject(todoIds: string[], category?: string): Promise<Todo[]> {
    if (!this.todoManager) {
      throw new Error('Smart Todo Manager not initialized')
    }

    const promotedTodos: Todo[] = []
    
    for (const todoId of todoIds) {
      try {
        const promoted = await this.todoManager.promoteSessionTodoToProject(todoId, category)
        promotedTodos.push(promoted)
      } catch (error) {
        console.warn(`Failed to promote todo ${todoId}:`, error)
      }
    }

    return promotedTodos
  }

  /**
   * Generate session summary with smart insights
   */
  async generateSessionSummary(): Promise<{
    completedThisSession: Todo[]
    addedThisSession: Todo[]
    suggestions: Todo[]
    progressUpdate: string
    nextSessionRecommendations: string[]
  }> {
    if (!this.todoManager) {
      return {
        completedThisSession: [],
        addedThisSession: [],
        suggestions: [],
        progressUpdate: 'Smart Todo Manager not initialized',
        nextSessionRecommendations: []
      }
    }

    const sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    const progress = await this.todoManager.generateProgressReport()
    
    const completedThisSession = progress.recentlyCompleted.filter(t => 
      t.completedAt && t.completedAt > sessionStart
    )
    
    const addedThisSession = this.sessionTodos.filter(t => 
      t.createdAt > sessionStart
    )

    const suggestions = await this.todoManager.getSmartSuggestions()

    const progressUpdate = `Completed ${completedThisSession.length} todos this session. ` +
      `Overall progress: ${progress.completedTodos}/${progress.totalTodos} (${(progress.completionRate * 100).toFixed(1)}%)`

    const nextSessionRecommendations = [
      suggestions.length > 0 ? `Consider working on: ${suggestions[0].content}` : 'No high-priority tasks ready',
      progress.blockedTodos.length > 0 ? `Review ${progress.blockedTodos.length} blocked todos` : null,
      `Current velocity: ${progress.velocity} todos/week`
    ].filter(Boolean) as string[]

    return {
      completedThisSession,
      addedThisSession,
      suggestions: suggestions.slice(0, 3),
      progressUpdate,
      nextSessionRecommendations
    }
  }

  /**
   * Auto-sync todos when Claude Code session ends
   */
  async endSession(): Promise<void> {
    if (!this.todoManager) return

    try {
      // Final sync
      await this.todoManager.syncSessionTodos(this.sessionTodos)
      
      // Update FUTURE_TODO.md
      await this.todoManager.syncToFutureTodoMd()
      
      // Run final completion detection
      await this.todoManager.runCompletionDetection()
      
      console.log('✅ Smart todos synced successfully')
    } catch (error) {
      console.error('❌ Error ending smart todo session:', error)
    }
  }

  private async getCurrentFileContext(): Promise<string[]> {
    // In a real Claude Code integration, this would get the current files being worked on
    // For now, return empty array
    return []
  }

  /**
   * Format todos for Claude Code display
   */
  formatTodosForDisplay(todos: Todo[]): string {
    let output = '## 📋 Smart Todos\n\n'
    
    const todosByStatus = {
      pending: todos.filter(t => t.status === 'pending'),
      in_progress: todos.filter(t => t.status === 'in_progress'),
      completed: todos.filter(t => t.status === 'completed'),
      blocked: todos.filter(t => t.status === 'blocked')
    }

    for (const [status, statusTodos] of Object.entries(todosByStatus)) {
      if (statusTodos.length === 0) continue
      
      const statusEmoji = {
        pending: '⏳',
        in_progress: '🔄',
        completed: '✅',
        blocked: '⛔'
      }[status] || '📋'
      
      output += `### ${statusEmoji} ${status.replace('_', ' ').toUpperCase()} (${statusTodos.length})\n\n`
      
      for (const todo of statusTodos) {
        const priority = todo.priority.toUpperCase()
        const estimate = todo.estimatedHours ? ` (${todo.estimatedHours}h)` : ''
        
        output += `- **[${priority}]** ${todo.content}${estimate}\n`
        
        if (todo.tags && todo.tags.length > 0) {
          output += `  - *Tags: ${todo.tags.join(', ')}*\n`
        }
      }
      
      output += '\n'
    }

    return output
  }

  /**
   * Format progress for Claude Code display
   */
  formatProgressForDisplay(progress: any): string {
    const completionRate = (progress.completionRate * 100).toFixed(1)
    const progressBar = '█'.repeat(Math.floor(progress.completionRate * 20)) + 
                       '░'.repeat(20 - Math.floor(progress.completionRate * 20))
    
    return `## 📊 Progress Update

**Overall Progress:** ${progress.completedTodos}/${progress.totalTodos} (${completionRate}%)
\`${progressBar}\` ${completionRate}%

**Velocity:** ${progress.velocity} todos/week
**Estimated Completion:** ${progress.estimatedCompletion.toDateString()}

${progress.blockedTodos.length > 0 ? `⚠️ **${progress.blockedTodos.length} blocked todos** need attention` : '✅ No blocked todos'}
`
  }
}