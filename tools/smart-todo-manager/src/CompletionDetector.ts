import { Todo, DetectionResult, GitCommitInfo, CompletionPattern } from './types'
import { GitIntegration } from './GitIntegration'

export class CompletionDetector {
  private gitIntegration: GitIntegration

  constructor(gitIntegration: GitIntegration) {
    this.gitIntegration = gitIntegration
  }

  async checkTodoCompletion(todo: Todo, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null> {
    // Skip if already completed
    if (todo.status === 'completed') {
      return null
    }

    // Check each completion pattern
    for (const pattern of todo.completionPatterns || []) {
      const result = await this.checkPattern(todo, pattern, recentCommits)
      if (result && result.confidence > 0.5) {
        return result
      }
    }

    // Fallback: heuristic detection based on todo content
    return await this.heuristicDetection(todo, recentCommits)
  }

  private async checkPattern(todo: Todo, pattern: CompletionPattern, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null> {
    switch (pattern.type) {
      case 'file_exists':
        return await this.checkFileExistsPattern(todo, pattern)
      
      case 'file_contains':
        return await this.checkFileContainsPattern(todo, pattern)
      
      case 'commit_message':
        return await this.checkCommitMessagePattern(todo, pattern, recentCommits)
      
      case 'build_success':
        return await this.checkBuildSuccessPattern(todo, pattern)
      
      case 'test_pass':
        return await this.checkTestPassPattern(todo, pattern)
      
      default:
        return null
    }
  }

  private async checkFileExistsPattern(todo: Todo, pattern: CompletionPattern): Promise<DetectionResult | null> {
    if (!pattern.pattern) {
      return null
    }

    const fileExists = await this.gitIntegration.checkFileExists(pattern.pattern)
    
    if (fileExists) {
      return {
        todoId: todo.id,
        detectionType: 'file_exists',
        confidence: pattern.confidence,
        evidence: `File ${pattern.pattern} was created`,
        suggestedAction: 'mark_completed'
      }
    }

    return null
  }

  private async checkFileContainsPattern(todo: Todo, pattern: CompletionPattern): Promise<DetectionResult | null> {
    if (!pattern.pattern) {
      return null
    }

    // Extract filename and search pattern from pattern string
    const [filePath, searchPattern] = pattern.pattern.split('::')
    
    if (!filePath || !searchPattern) {
      return null
    }

    const fileContent = await this.gitIntegration.getFileContent(filePath)
    
    if (fileContent && fileContent.includes(searchPattern)) {
      return {
        todoId: todo.id,
        detectionType: 'file_contains',
        confidence: pattern.confidence,
        evidence: `File ${filePath} contains "${searchPattern}"`,
        suggestedAction: 'mark_completed'
      }
    }

    return null
  }

  private async checkCommitMessagePattern(todo: Todo, pattern: CompletionPattern, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null> {
    const regex = new RegExp(pattern.pattern, 'i')
    
    for (const commit of recentCommits) {
      if (regex.test(commit.message)) {
        return {
          todoId: todo.id,
          detectionType: 'commit_message',
          confidence: pattern.confidence,
          evidence: `Commit "${commit.message}" matches pattern`,
          suggestedAction: 'mark_completed'
        }
      }
    }

    return null
  }

  private async checkBuildSuccessPattern(todo: Todo, pattern: CompletionPattern): Promise<DetectionResult | null> {
    // Check for successful build indicators
    const buildFiles = [
      'package.json',
      'go.mod',
      'Dockerfile',
      '.github/workflows',
      'Makefile'
    ]

    for (const buildFile of buildFiles) {
      if (await this.gitIntegration.checkFileExists(buildFile)) {
        // Look for recent commits that suggest build success
        const recentCommits = await this.gitIntegration.getRecentCommits(new Date(Date.now() - 24 * 60 * 60 * 1000))
        
        for (const commit of recentCommits) {
          if (this.isBuildSuccessCommit(commit.message)) {
            return {
              todoId: todo.id,
              detectionType: 'build_success',
              confidence: pattern.confidence,
              evidence: `Build success indicated by commit: ${commit.message}`,
              suggestedAction: 'mark_completed'
            }
          }
        }
      }
    }

    return null
  }

  private async checkTestPassPattern(todo: Todo, pattern: CompletionPattern): Promise<DetectionResult | null> {
    // Check for test success indicators
    const recentCommits = await this.gitIntegration.getRecentCommits(new Date(Date.now() - 24 * 60 * 60 * 1000))
    
    for (const commit of recentCommits) {
      if (this.isTestPassCommit(commit.message)) {
        return {
          todoId: todo.id,
          detectionType: 'test_pass',
          confidence: pattern.confidence,
          evidence: `Tests passing indicated by commit: ${commit.message}`,
          suggestedAction: 'mark_completed'
        }
      }
    }

    return null
  }

  private async heuristicDetection(todo: Todo, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null> {
    const todoWords = this.extractKeywords(todo.content)
    
    // Check commit messages for todo-related keywords
    for (const commit of recentCommits) {
      const confidence = this.calculateCommitRelevance(todo, commit)
      
      if (confidence > 0.6) {
        return {
          todoId: todo.id,
          detectionType: 'heuristic_commit',
          confidence,
          evidence: `Commit message suggests completion: "${commit.message}"`,
          suggestedAction: confidence > 0.8 ? 'mark_completed' : 'update_progress'
        }
      }
    }

    // Check file changes for todo-related files
    if (todo.filePaths && todo.filePaths.length > 0) {
      for (const commit of recentCommits) {
        const relevantFiles = commit.changedFiles.filter(file => 
          todo.filePaths!.some(todoFile => 
            file.includes(todoFile) || todoFile.includes(file)
          )
        )

        if (relevantFiles.length > 0) {
          const confidence = 0.7 + (relevantFiles.length * 0.1)
          
          return {
            todoId: todo.id,
            detectionType: 'heuristic_files',
            confidence: Math.min(confidence, 0.9),
            evidence: `Related files modified: ${relevantFiles.join(', ')}`,
            suggestedAction: confidence > 0.8 ? 'mark_completed' : 'update_progress'
          }
        }
      }
    }

    // Check for component/service creation patterns
    const creationResult = await this.detectCreationCompletion(todo, recentCommits)
    if (creationResult) {
      return creationResult
    }

    return null
  }

  private calculateCommitRelevance(todo: Todo, commit: GitCommitInfo): number {
    const todoWords = this.extractKeywords(todo.content)
    const commitWords = this.extractKeywords(commit.message)
    
    let matchScore = 0
    let totalWords = todoWords.length
    
    // Check for exact keyword matches
    for (const todoWord of todoWords) {
      if (commitWords.some(commitWord => 
        commitWord.toLowerCase().includes(todoWord.toLowerCase()) ||
        todoWord.toLowerCase().includes(commitWord.toLowerCase())
      )) {
        matchScore += 1
      }
    }

    // Bonus for completion indicators in commit message
    const completionWords = ['complete', 'implement', 'add', 'create', 'build', 'finish', 'done', 'fix']
    const hasCompletionWord = completionWords.some(word => 
      commit.message.toLowerCase().includes(word)
    )
    
    if (hasCompletionWord) {
      matchScore += 0.5
    }

    // Bonus for todo-specific patterns
    if (todo.content.toLowerCase().includes('create') && commit.message.toLowerCase().includes('create')) {
      matchScore += 0.5
    }
    
    if (todo.content.toLowerCase().includes('implement') && commit.message.toLowerCase().includes('implement')) {
      matchScore += 0.5
    }

    return Math.min(matchScore / Math.max(totalWords, 1), 1.0)
  }

  private async detectCreationCompletion(todo: Todo, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null> {
    const content = todo.content.toLowerCase()
    
    // Look for creation todos
    if (content.includes('create') || content.includes('add') || content.includes('implement')) {
      // Extract what should be created
      const targetName = this.extractCreationTarget(todo.content)
      
      if (targetName) {
        // Check if files with similar names were created
        for (const commit of recentCommits) {
          const createdFiles = commit.changedFiles.filter(file => 
            file.toLowerCase().includes(targetName.toLowerCase()) ||
            targetName.toLowerCase().includes(this.getFileName(file).toLowerCase())
          )
          
          if (createdFiles.length > 0) {
            return {
              todoId: todo.id,
              detectionType: 'creation_detection',
              confidence: 0.8,
              evidence: `Created files matching "${targetName}": ${createdFiles.join(', ')}`,
              suggestedAction: 'mark_completed'
            }
          }
        }
      }
    }

    return null
  }

  private extractKeywords(text: string): string[] {
    // Extract meaningful words, excluding common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  }

  private extractCreationTarget(todoContent: string): string | null {
    // Common patterns for creation todos
    const patterns = [
      /create\s+(\w+(?:\s+\w+)?)/i,
      /add\s+(\w+(?:\s+\w+)?)/i,
      /implement\s+(\w+(?:\s+\w+)?)/i,
      /build\s+(\w+(?:\s+\w+)?)/i
    ]
    
    for (const pattern of patterns) {
      const match = todoContent.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return null
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop()?.split('.')[0] || ''
  }

  private isBuildSuccessCommit(message: string): boolean {
    const buildSuccessPatterns = [
      /build\s+success/i,
      /build\s+complete/i,
      /successfully\s+built/i,
      /build\s+passing/i,
      /compilation\s+successful/i
    ]
    
    return buildSuccessPatterns.some(pattern => pattern.test(message))
  }

  private isTestPassCommit(message: string): boolean {
    const testPassPatterns = [
      /tests?\s+pass/i,
      /all\s+tests?\s+passing/i,
      /test\s+suite\s+passing/i,
      /green\s+build/i,
      /\d+\s+tests?\s+passed/i
    ]
    
    return testPassPatterns.some(pattern => pattern.test(message))
  }

  // Generate completion patterns for new todos
  generateCompletionPatterns(todo: Todo): CompletionPattern[] {
    const patterns: CompletionPattern[] = []
    const content = todo.content.toLowerCase()
    
    // File creation patterns
    if (content.includes('create') || content.includes('add')) {
      const target = this.extractCreationTarget(todo.content)
      if (target) {
        // Look for files that might be created
        const possibleExtensions = ['.tsx', '.ts', '.js', '.go', '.py', '.md']
        for (const ext of possibleExtensions) {
          patterns.push({
            type: 'file_exists',
            pattern: `src/**/*${target.replace(/\s+/g, '')}*${ext}`,
            confidence: 0.7
          })
        }
      }
    }

    // Commit message patterns
    const keywords = this.extractKeywords(todo.content)
    if (keywords.length > 0) {
      patterns.push({
        type: 'commit_message',
        pattern: `(implement|add|create|build|complete).*${keywords.slice(0, 2).join('|')}`,
        confidence: 0.6
      })
    }

    // Build/test patterns for infrastructure todos
    if (content.includes('deploy') || content.includes('build') || content.includes('ci/cd')) {
      patterns.push({
        type: 'build_success',
        pattern: 'deployment|build',
        confidence: 0.8
      })
    }

    if (content.includes('test') || content.includes('testing')) {
      patterns.push({
        type: 'test_pass',
        pattern: 'test',
        confidence: 0.8
      })
    }

    return patterns
  }
}