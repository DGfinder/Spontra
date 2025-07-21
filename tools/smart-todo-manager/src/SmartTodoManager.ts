import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { 
  Todo, 
  ProjectTodos, 
  TodoSyncResult, 
  ProgressReport, 
  SmartTodoConfig,
  DetectionResult,
  TodoAnalytics,
  GitCommitInfo,
  CompletionPattern
} from './types'
import { FutureTodoParser } from './FutureTodoParser'
import { GitIntegration } from './GitIntegration'
import { CompletionDetector } from './CompletionDetector'
import { AnalyticsEngine } from './AnalyticsEngine'

export class SmartTodoManager {
  private config: SmartTodoConfig
  private projectTodos: ProjectTodos
  private futureTodoParser: FutureTodoParser
  private gitIntegration: GitIntegration
  private completionDetector: CompletionDetector
  private analyticsEngine: AnalyticsEngine
  private lastSyncTime: Date = new Date(0)

  constructor(config: SmartTodoConfig) {
    this.config = config
    this.projectTodos = {
      sessionTodos: [],
      projectTodos: [],
      futureTodos: [],
      archivedTodos: []
    }
    
    this.futureTodoParser = new FutureTodoParser(config.futureTodoPath)
    this.gitIntegration = new GitIntegration(config.projectRoot)
    this.completionDetector = new CompletionDetector(this.gitIntegration)
    this.analyticsEngine = new AnalyticsEngine()
  }

  async initialize(): Promise<void> {
    // Load existing todos from persistent storage
    await this.loadProjectTodos()
    
    // Parse FUTURE_TODO.md
    await this.loadFutureTodos()
    
    // Set up git hooks if enabled
    if (this.config.gitEnabled) {
      await this.gitIntegration.setupHooks()
    }
    
    // Run initial completion detection
    if (this.config.autoDetectionEnabled) {
      await this.runCompletionDetection()
    }
  }

  // Session Integration Methods
  async syncSessionTodos(sessionTodos: Todo[]): Promise<TodoSyncResult> {
    const result: TodoSyncResult = {
      added: [],
      updated: [],
      completed: [],
      conflicts: []
    }

    // Process each session todo
    for (const sessionTodo of sessionTodos) {
      const existingTodo = this.findTodoById(sessionTodo.id)
      
      if (!existingTodo) {
        // New todo from session
        const projectTodo = this.convertSessionTodoToProject(sessionTodo)
        this.projectTodos.projectTodos.push(projectTodo)
        result.added.push(projectTodo)
      } else {
        // Update existing todo
        const updateResult = this.mergeTodos(existingTodo, sessionTodo)
        if (updateResult.hasConflicts) {
          result.conflicts.push(...updateResult.conflicts)
        } else {
          Object.assign(existingTodo, updateResult.mergedTodo)
          result.updated.push(existingTodo)
          
          if (existingTodo.status === 'completed' && sessionTodo.status === 'completed') {
            result.completed.push(existingTodo)
          }
        }
      }
    }

    // Save updated todos
    await this.saveProjectTodos()
    
    // Update FUTURE_TODO.md if needed
    await this.syncToFutureTodoMd()
    
    this.lastSyncTime = new Date()
    return result
  }

  async promoteSessionTodoToProject(todoId: string, category?: string): Promise<Todo> {
    const sessionTodo = this.projectTodos.sessionTodos.find(t => t.id === todoId)
    if (!sessionTodo) {
      throw new Error(`Session todo with ID ${todoId} not found`)
    }

    const projectTodo = this.convertSessionTodoToProject(sessionTodo, category)
    this.projectTodos.projectTodos.push(projectTodo)
    
    // Remove from session todos
    this.projectTodos.sessionTodos = this.projectTodos.sessionTodos.filter(t => t.id !== todoId)
    
    await this.saveProjectTodos()
    return projectTodo
  }

  // Completion Detection Methods
  async runCompletionDetection(): Promise<DetectionResult[]> {
    const results: DetectionResult[] = []
    
    if (!this.config.autoDetectionEnabled) {
      return results
    }

    // Get recent git commits
    const recentCommits = await this.gitIntegration.getRecentCommits(this.lastSyncTime)
    
    // Check each pending/in-progress todo
    const activeTodos = this.projectTodos.projectTodos.filter(
      t => t.status === 'pending' || t.status === 'in_progress'
    )

    for (const todo of activeTodos) {
      const detectionResult = await this.completionDetector.checkTodoCompletion(todo, recentCommits)
      
      if (detectionResult && detectionResult.confidence > 0.7) {
        results.push(detectionResult)
        
        // Auto-complete high-confidence detections
        if (detectionResult.confidence > 0.9 && detectionResult.suggestedAction === 'mark_completed') {
          await this.markTodoCompleted(todo.id, `Auto-detected: ${detectionResult.evidence}`)
        }
      }
    }

    return results
  }

  async markTodoCompleted(todoId: string, reason?: string): Promise<Todo> {
    const todo = this.findTodoById(todoId)
    if (!todo) {
      throw new Error(`Todo with ID ${todoId} not found`)
    }

    todo.status = 'completed'
    todo.completedAt = new Date()
    todo.updatedAt = new Date()
    
    if (reason) {
      todo.tags = [...(todo.tags || []), `auto-completed: ${reason}`]
    }

    // Move to archived todos
    this.projectTodos.archivedTodos.push(todo)
    this.projectTodos.projectTodos = this.projectTodos.projectTodos.filter(t => t.id !== todoId)
    
    // Update any dependent todos
    await this.updateDependentTodos(todoId)
    
    await this.saveProjectTodos()
    await this.syncToFutureTodoMd()
    
    return todo
  }

  // Progress Tracking Methods
  async generateProgressReport(): Promise<ProgressReport> {
    const allTodos = [...this.projectTodos.projectTodos, ...this.projectTodos.archivedTodos]
    const completedTodos = allTodos.filter(t => t.status === 'completed')
    const blockedTodos = this.projectTodos.projectTodos.filter(t => t.status === 'blocked')
    
    // Calculate velocity (todos completed per week)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentlyCompleted = completedTodos.filter(t => 
      t.completedAt && t.completedAt > oneWeekAgo
    )

    // Calculate average completion time
    const completedWithTime = completedTodos.filter(t => 
      t.completedAt && t.createdAt && t.actualHours
    )
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedWithTime.length
      : 0

    // Estimate completion date for remaining work
    const remainingTodos = this.projectTodos.projectTodos.filter(t => 
      t.status === 'pending' || t.status === 'in_progress'
    )
    const totalEstimatedHours = remainingTodos.reduce((sum, t) => sum + (t.estimatedHours || 4), 0)
    const weeklyVelocity = recentlyCompleted.length || 1
    const weeksToComplete = remainingTodos.length / weeklyVelocity
    const estimatedCompletion = new Date(Date.now() + weeksToComplete * 7 * 24 * 60 * 60 * 1000)

    return {
      totalTodos: allTodos.length,
      completedTodos: completedTodos.length,
      completionRate: allTodos.length > 0 ? completedTodos.length / allTodos.length : 0,
      averageCompletionTime: avgCompletionTime,
      velocity: weeklyVelocity,
      estimatedCompletion,
      blockedTodos,
      upcomingTodos: this.getUpcomingTodos(),
      recentlyCompleted: recentlyCompleted.slice(0, 10)
    }
  }

  async getAnalytics(): Promise<TodoAnalytics> {
    return this.analyticsEngine.generateAnalytics(this.projectTodos)
  }

  // FUTURE_TODO.md Integration
  async syncToFutureTodoMd(): Promise<void> {
    const futureTodos = this.projectTodos.futureTodos
    const projectTodos = this.projectTodos.projectTodos
    const archivedTodos = this.projectTodos.archivedTodos
    
    await this.futureTodoParser.updateFutureTodoMd(futureTodos, projectTodos, archivedTodos)
  }

  async loadFutureTodos(): Promise<void> {
    this.projectTodos.futureTodos = await this.futureTodoParser.parseFutureTodos()
  }

  // Smart Suggestions
  async getSmartSuggestions(currentContext?: { filePaths?: string[], recentCommits?: GitCommitInfo[] }): Promise<Todo[]> {
    const suggestions: Todo[] = []
    
    // Get unblocked, high-priority todos
    const readyTodos = this.projectTodos.projectTodos.filter(todo => 
      todo.status === 'pending' && 
      todo.priority === 'high' &&
      this.isTodoUnblocked(todo)
    )

    // Context-aware suggestions
    if (currentContext?.filePaths) {
      const contextualTodos = readyTodos.filter(todo =>
        todo.filePaths?.some(path => 
          currentContext.filePaths!.some(contextPath => 
            path.includes(contextPath) || contextPath.includes(path)
          )
        )
      )
      suggestions.push(...contextualTodos.slice(0, 3))
    }

    // Add general high-priority todos if we need more suggestions
    if (suggestions.length < 5) {
      const remaining = readyTodos.filter(todo => !suggestions.includes(todo))
      suggestions.push(...remaining.slice(0, 5 - suggestions.length))
    }

    return suggestions
  }

  // Utility Methods
  private findTodoById(id: string): Todo | undefined {
    return [...this.projectTodos.projectTodos, ...this.projectTodos.sessionTodos, ...this.projectTodos.archivedTodos]
      .find(t => t.id === id)
  }

  private convertSessionTodoToProject(sessionTodo: Todo, category?: string): Todo {
    return {
      ...sessionTodo,
      id: sessionTodo.id || uuidv4(),
      category: category || 'development',
      createdAt: sessionTodo.createdAt || new Date(),
      updatedAt: new Date(),
      completionPatterns: this.generateCompletionPatterns(sessionTodo)
    }
  }

  private generateCompletionPatterns(todo: Todo): CompletionPattern[] {
    const patterns: CompletionPattern[] = []
    
    // Generate patterns based on todo content
    const content = todo.content.toLowerCase()
    
    if (content.includes('create') || content.includes('add')) {
      patterns.push({
        type: 'file_exists',
        pattern: this.extractFilePathFromContent(content),
        confidence: 0.8
      })
    }
    
    if (content.includes('implement') || content.includes('build')) {
      patterns.push({
        type: 'commit_message',
        pattern: `(implement|build|add).*${this.extractKeywordsFromContent(content)}`,
        confidence: 0.7
      })
    }
    
    return patterns
  }

  private extractFilePathFromContent(content: string): string {
    // Extract likely file paths from todo content
    const matches = content.match(/[\w\/\.-]+\.(ts|tsx|js|jsx|go|py|md|json)/g)
    return matches ? matches[0] : ''
  }

  private extractKeywordsFromContent(content: string): string {
    // Extract key terms that might appear in commit messages
    const words = content.split(' ').filter(w => w.length > 3 && !['create', 'implement', 'build', 'add'].includes(w))
    return words.slice(0, 2).join('|')
  }

  private mergeTodos(existing: Todo, updated: Todo): { mergedTodo: Todo, hasConflicts: boolean, conflicts: any[] } {
    // Simple merge strategy - can be enhanced
    const mergedTodo = { ...existing }
    const conflicts: any[] = []
    
    // Update safe fields
    if (updated.status && updated.status !== existing.status) {
      mergedTodo.status = updated.status
    }
    
    if (updated.actualHours && updated.actualHours !== existing.actualHours) {
      mergedTodo.actualHours = updated.actualHours
    }
    
    mergedTodo.updatedAt = new Date()
    
    return { mergedTodo, hasConflicts: conflicts.length > 0, conflicts }
  }

  private getUpcomingTodos(): Todo[] {
    return this.projectTodos.projectTodos
      .filter(t => t.status === 'pending' && this.isTodoUnblocked(t))
      .sort((a, b) => {
        // Sort by priority then by creation date
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority] || 0
        const bPriority = priorityOrder[b.priority] || 0
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      .slice(0, 10)
  }

  private isTodoUnblocked(todo: Todo): boolean {
    if (!todo.dependencies || todo.dependencies.length === 0) {
      return true
    }
    
    return todo.dependencies.every(depId => {
      const depTodo = this.findTodoById(depId)
      return depTodo?.status === 'completed'
    })
  }

  private async updateDependentTodos(completedTodoId: string): Promise<void> {
    const dependentTodos = this.projectTodos.projectTodos.filter(todo =>
      todo.dependencies?.includes(completedTodoId)
    )
    
    for (const todo of dependentTodos) {
      if (this.isTodoUnblocked(todo) && todo.status === 'blocked') {
        todo.status = 'pending'
        todo.updatedAt = new Date()
      }
    }
  }

  // Persistence Methods
  private async loadProjectTodos(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.todoDataPath, 'utf-8')
      this.projectTodos = JSON.parse(data, this.dateReviver)
    } catch (error) {
      // File doesn't exist yet, start with empty todos
      console.log('No existing todo data found, starting fresh')
    }
  }

  private async saveProjectTodos(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.config.todoDataPath)
    await fs.mkdir(dir, { recursive: true })
    
    // Save with pretty formatting
    await fs.writeFile(
      this.config.todoDataPath, 
      JSON.stringify(this.projectTodos, this.dateReplacer, 2)
    )
    
    // Create backup if enabled
    if (this.config.backupEnabled) {
      const backupPath = `${this.config.todoDataPath}.backup.${Date.now()}`
      await fs.writeFile(backupPath, JSON.stringify(this.projectTodos, this.dateReplacer, 2))
    }
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  }

  private dateReviver(key: string, value: any): any {
    if (typeof value === 'object' && value !== null && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  }
}