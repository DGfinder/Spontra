import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import { GitCommitInfo, FileChangeInfo } from './types'

const execAsync = promisify(exec)

export class GitIntegration {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async setupHooks(): Promise<void> {
    try {
      // Create post-commit hook
      await this.createPostCommitHook()
      
      // Create pre-push hook
      await this.createPrePushHook()
      
      console.log('Git hooks set up successfully')
    } catch (error) {
      console.error('Error setting up git hooks:', error)
    }
  }

  async getRecentCommits(since: Date, maxCount: number = 50): Promise<GitCommitInfo[]> {
    try {
      const sinceString = since.toISOString()
      const command = `git log --since="${sinceString}" --pretty=format:"%H|%s|%an|%ai" --name-only -${maxCount}`
      
      const { stdout } = await execAsync(command, { cwd: this.projectRoot })
      
      if (!stdout.trim()) {
        return []
      }
      
      return this.parseGitLogOutput(stdout)
    } catch (error) {
      console.error('Error getting recent commits:', error)
      return []
    }
  }

  async getCommitDetails(commitHash: string): Promise<GitCommitInfo | null> {
    try {
      const command = `git show --pretty=format:"%H|%s|%an|%ai" --name-status ${commitHash}`
      const { stdout } = await execAsync(command, { cwd: this.projectRoot })
      
      if (!stdout.trim()) {
        return null
      }
      
      const lines = stdout.split('\n')
      const commitLine = lines[0]
      const [hash, message, author, dateStr] = commitLine.split('|')
      
      const changedFiles: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line && !line.startsWith('diff') && !line.startsWith('index')) {
          // Extract filename from status line (e.g., "A\tfile.txt" or "M\tfile.txt")
          const fileParts = line.split('\t')
          if (fileParts.length >= 2) {
            changedFiles.push(fileParts[1])
          }
        }
      }
      
      return {
        hash,
        message,
        author,
        date: new Date(dateStr),
        changedFiles
      }
    } catch (error) {
      console.error('Error getting commit details:', error)
      return null
    }
  }

  async getFileChanges(commitHash: string): Promise<FileChangeInfo[]> {
    try {
      const command = `git show --numstat ${commitHash}`
      const { stdout } = await execAsync(command, { cwd: this.projectRoot })
      
      const changes: FileChangeInfo[] = []
      const lines = stdout.split('\n')
      
      for (const line of lines) {
        const parts = line.trim().split('\t')
        if (parts.length === 3) {
          const [added, deleted, filename] = parts
          
          changes.push({
            path: filename,
            action: added === '0' && deleted !== '0' ? 'deleted' : 
                   added !== '0' && deleted === '0' ? 'added' : 'modified',
            linesAdded: parseInt(added) || 0,
            linesDeleted: parseInt(deleted) || 0
          })
        }
      }
      
      return changes
    } catch (error) {
      console.error('Error getting file changes:', error)
      return []
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: this.projectRoot })
      return stdout.trim()
    } catch (error) {
      console.error('Error getting current branch:', error)
      return 'main'
    }
  }

  async getUncommittedChanges(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectRoot })
      
      return stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.slice(3)) // Remove status prefix
    } catch (error) {
      console.error('Error getting uncommitted changes:', error)
      return []
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const changes = await this.getUncommittedChanges()
    return changes.length > 0
  }

  async searchCommitMessages(pattern: string, since?: Date, maxCount: number = 100): Promise<GitCommitInfo[]> {
    try {
      let command = `git log --grep="${pattern}" --pretty=format:"%H|%s|%an|%ai" --name-only -${maxCount}`
      
      if (since) {
        command += ` --since="${since.toISOString()}"`
      }
      
      const { stdout } = await execAsync(command, { cwd: this.projectRoot })
      
      if (!stdout.trim()) {
        return []
      }
      
      return this.parseGitLogOutput(stdout)
    } catch (error) {
      console.error('Error searching commit messages:', error)
      return []
    }
  }

  async getCommitsAffectingFiles(filePaths: string[], since?: Date): Promise<GitCommitInfo[]> {
    try {
      let command = `git log --pretty=format:"%H|%s|%an|%ai" --name-only --follow -- ${filePaths.join(' ')}`
      
      if (since) {
        command += ` --since="${since.toISOString()}"`
      }
      
      const { stdout } = await execAsync(command, { cwd: this.projectRoot })
      
      if (!stdout.trim()) {
        return []
      }
      
      return this.parseGitLogOutput(stdout)
    } catch (error) {
      console.error('Error getting commits affecting files:', error)
      return []
    }
  }

  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectRoot, filePath))
      return true
    } catch {
      return false
    }
  }

  async getFileContent(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      return await fs.readFile(fullPath, 'utf-8')
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return null
    }
  }

  private parseGitLogOutput(output: string): GitCommitInfo[] {
    const commits: GitCommitInfo[] = []
    const blocks = output.split('\n\n').filter(block => block.trim())
    
    for (const block of blocks) {
      const lines = block.split('\n')
      const commitLine = lines[0]
      
      if (!commitLine.includes('|')) continue
      
      const [hash, message, author, dateStr] = commitLine.split('|')
      
      // Collect changed files (lines after the commit line that don't contain |)
      const changedFiles: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line && !line.includes('|')) {
          changedFiles.push(line)
        }
      }
      
      commits.push({
        hash,
        message,
        author,
        date: new Date(dateStr),
        changedFiles
      })
    }
    
    return commits
  }

  private async createPostCommitHook(): Promise<void> {
    const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'post-commit')
    
    const hookContent = `#!/bin/bash
# Smart Todo Manager post-commit hook
# This hook runs the todo completion detection after each commit

# Get the commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Run the todo detection script
node "$(git rev-parse --show-toplevel)/tools/smart-todo-manager/scripts/detect-completion.js" --commit $COMMIT_HASH

# Exit with success to not block the commit
exit 0
`

    await fs.writeFile(hookPath, hookContent)
    await fs.chmod(hookPath, 0o755) // Make executable
  }

  private async createPrePushHook(): Promise<void> {
    const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'pre-push')
    
    const hookContent = `#!/bin/bash
# Smart Todo Manager pre-push hook
# This hook runs a comprehensive todo sync before pushing

# Run todo sync
node "$(git rev-parse --show-toplevel)/tools/smart-todo-manager/scripts/sync-todos.js" --pre-push

# Exit with the script's exit code
exit $?
`

    await fs.writeFile(hookPath, hookContent)
    await fs.chmod(hookPath, 0o755) // Make executable
  }

  async createDetectionScript(): Promise<void> {
    const scriptDir = path.join(this.projectRoot, 'tools', 'smart-todo-manager', 'scripts')
    const scriptPath = path.join(scriptDir, 'detect-completion.js')
    
    // Ensure directory exists
    await fs.mkdir(scriptDir, { recursive: true })
    
    const scriptContent = `#!/usr/bin/env node
// Smart Todo Manager - Completion Detection Script
// This script is called by git hooks to detect completed todos

const { SmartTodoManager } = require('../dist/SmartTodoManager.js')
const path = require('path')

async function main() {
  const projectRoot = process.cwd()
  const config = {
    projectRoot,
    futureTodoPath: path.join(projectRoot, 'FUTURE_TODO.md'),
    todoDataPath: path.join(projectRoot, '.todo-data', 'todos.json'),
    gitEnabled: true,
    autoDetectionEnabled: true,
    syncInterval: 60,
    backupEnabled: true,
    maxArchiveSize: 1000
  }
  
  const todoManager = new SmartTodoManager(config)
  await todoManager.initialize()
  
  // Run completion detection
  const detectionResults = await todoManager.runCompletionDetection()
  
  if (detectionResults.length > 0) {
    console.log(\`🎯 Detected \${detectionResults.length} potential todo completions:\`)
    for (const result of detectionResults) {
      console.log(\`  - \${result.evidence} (confidence: \${(result.confidence * 100).toFixed(0)}%)\`)
    }
  }
}

main().catch(console.error)
`

    await fs.writeFile(scriptPath, scriptContent)
    await fs.chmod(scriptPath, 0o755) // Make executable

    // Also create sync script
    const syncScriptPath = path.join(scriptDir, 'sync-todos.js')
    const syncScriptContent = `#!/usr/bin/env node
// Smart Todo Manager - Todo Sync Script
// This script syncs todos before pushing

const { SmartTodoManager } = require('../dist/SmartTodoManager.js')
const path = require('path')

async function main() {
  const projectRoot = process.cwd()
  const config = {
    projectRoot,
    futureTodoPath: path.join(projectRoot, 'FUTURE_TODO.md'),
    todoDataPath: path.join(projectRoot, '.todo-data', 'todos.json'),
    gitEnabled: true,
    autoDetectionEnabled: true,
    syncInterval: 60,
    backupEnabled: true,
    maxArchiveSize: 1000
  }
  
  const todoManager = new SmartTodoManager(config)
  await todoManager.initialize()
  
  // Sync FUTURE_TODO.md
  await todoManager.syncToFutureTodoMd()
  
  // Generate progress report
  const progress = await todoManager.generateProgressReport()
  
  console.log(\`📊 Todo Progress: \${progress.completedTodos}/\${progress.totalTodos} (\${(progress.completionRate * 100).toFixed(1)}%) completed\`)
  
  if (progress.blockedTodos.length > 0) {
    console.log(\`⛔ \${progress.blockedTodos.length} blocked todos need attention\`)
  }
}

main().catch(console.error)
`

    await fs.writeFile(syncScriptPath, syncScriptContent)
    await fs.chmod(syncScriptPath, 0o755) // Make executable
  }
}