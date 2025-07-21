"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitIntegration = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitIntegration {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async setupHooks() {
        try {
            // Create post-commit hook
            await this.createPostCommitHook();
            // Create pre-push hook
            await this.createPrePushHook();
            console.log('Git hooks set up successfully');
        }
        catch (error) {
            console.error('Error setting up git hooks:', error);
        }
    }
    async getRecentCommits(since, maxCount = 50) {
        try {
            const sinceString = since.toISOString();
            const command = `git log --since="${sinceString}" --pretty=format:"%H|%s|%an|%ai" --name-only -${maxCount}`;
            const { stdout } = await execAsync(command, { cwd: this.projectRoot });
            if (!stdout.trim()) {
                return [];
            }
            return this.parseGitLogOutput(stdout);
        }
        catch (error) {
            console.error('Error getting recent commits:', error);
            return [];
        }
    }
    async getCommitDetails(commitHash) {
        try {
            const command = `git show --pretty=format:"%H|%s|%an|%ai" --name-status ${commitHash}`;
            const { stdout } = await execAsync(command, { cwd: this.projectRoot });
            if (!stdout.trim()) {
                return null;
            }
            const lines = stdout.split('\n');
            const commitLine = lines[0];
            const [hash, message, author, dateStr] = commitLine.split('|');
            const changedFiles = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('diff') && !line.startsWith('index')) {
                    // Extract filename from status line (e.g., "A\tfile.txt" or "M\tfile.txt")
                    const fileParts = line.split('\t');
                    if (fileParts.length >= 2) {
                        changedFiles.push(fileParts[1]);
                    }
                }
            }
            return {
                hash,
                message,
                author,
                date: new Date(dateStr),
                changedFiles
            };
        }
        catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }
    async getFileChanges(commitHash) {
        try {
            const command = `git show --numstat ${commitHash}`;
            const { stdout } = await execAsync(command, { cwd: this.projectRoot });
            const changes = [];
            const lines = stdout.split('\n');
            for (const line of lines) {
                const parts = line.trim().split('\t');
                if (parts.length === 3) {
                    const [added, deleted, filename] = parts;
                    changes.push({
                        path: filename,
                        action: added === '0' && deleted !== '0' ? 'deleted' :
                            added !== '0' && deleted === '0' ? 'added' : 'modified',
                        linesAdded: parseInt(added) || 0,
                        linesDeleted: parseInt(deleted) || 0
                    });
                }
            }
            return changes;
        }
        catch (error) {
            console.error('Error getting file changes:', error);
            return [];
        }
    }
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync('git branch --show-current', { cwd: this.projectRoot });
            return stdout.trim();
        }
        catch (error) {
            console.error('Error getting current branch:', error);
            return 'main';
        }
    }
    async getUncommittedChanges() {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectRoot });
            return stdout
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.slice(3)); // Remove status prefix
        }
        catch (error) {
            console.error('Error getting uncommitted changes:', error);
            return [];
        }
    }
    async hasUncommittedChanges() {
        const changes = await this.getUncommittedChanges();
        return changes.length > 0;
    }
    async searchCommitMessages(pattern, since, maxCount = 100) {
        try {
            let command = `git log --grep="${pattern}" --pretty=format:"%H|%s|%an|%ai" --name-only -${maxCount}`;
            if (since) {
                command += ` --since="${since.toISOString()}"`;
            }
            const { stdout } = await execAsync(command, { cwd: this.projectRoot });
            if (!stdout.trim()) {
                return [];
            }
            return this.parseGitLogOutput(stdout);
        }
        catch (error) {
            console.error('Error searching commit messages:', error);
            return [];
        }
    }
    async getCommitsAffectingFiles(filePaths, since) {
        try {
            let command = `git log --pretty=format:"%H|%s|%an|%ai" --name-only --follow -- ${filePaths.join(' ')}`;
            if (since) {
                command += ` --since="${since.toISOString()}"`;
            }
            const { stdout } = await execAsync(command, { cwd: this.projectRoot });
            if (!stdout.trim()) {
                return [];
            }
            return this.parseGitLogOutput(stdout);
        }
        catch (error) {
            console.error('Error getting commits affecting files:', error);
            return [];
        }
    }
    async checkFileExists(filePath) {
        try {
            await fs.access(path.join(this.projectRoot, filePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileContent(filePath) {
        try {
            const fullPath = path.join(this.projectRoot, filePath);
            return await fs.readFile(fullPath, 'utf-8');
        }
        catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return null;
        }
    }
    parseGitLogOutput(output) {
        const commits = [];
        const blocks = output.split('\n\n').filter(block => block.trim());
        for (const block of blocks) {
            const lines = block.split('\n');
            const commitLine = lines[0];
            if (!commitLine.includes('|'))
                continue;
            const [hash, message, author, dateStr] = commitLine.split('|');
            // Collect changed files (lines after the commit line that don't contain |)
            const changedFiles = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.includes('|')) {
                    changedFiles.push(line);
                }
            }
            commits.push({
                hash,
                message,
                author,
                date: new Date(dateStr),
                changedFiles
            });
        }
        return commits;
    }
    async createPostCommitHook() {
        const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'post-commit');
        const hookContent = `#!/bin/bash
# Smart Todo Manager post-commit hook
# This hook runs the todo completion detection after each commit

# Get the commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Run the todo detection script
node "$(git rev-parse --show-toplevel)/tools/smart-todo-manager/scripts/detect-completion.js" --commit $COMMIT_HASH

# Exit with success to not block the commit
exit 0
`;
        await fs.writeFile(hookPath, hookContent);
        await fs.chmod(hookPath, 0o755); // Make executable
    }
    async createPrePushHook() {
        const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'pre-push');
        const hookContent = `#!/bin/bash
# Smart Todo Manager pre-push hook
# This hook runs a comprehensive todo sync before pushing

# Run todo sync
node "$(git rev-parse --show-toplevel)/tools/smart-todo-manager/scripts/sync-todos.js" --pre-push

# Exit with the script's exit code
exit $?
`;
        await fs.writeFile(hookPath, hookContent);
        await fs.chmod(hookPath, 0o755); // Make executable
    }
    async createDetectionScript() {
        const scriptDir = path.join(this.projectRoot, 'tools', 'smart-todo-manager', 'scripts');
        const scriptPath = path.join(scriptDir, 'detect-completion.js');
        // Ensure directory exists
        await fs.mkdir(scriptDir, { recursive: true });
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
`;
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, 0o755); // Make executable
        // Also create sync script
        const syncScriptPath = path.join(scriptDir, 'sync-todos.js');
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
`;
        await fs.writeFile(syncScriptPath, syncScriptContent);
        await fs.chmod(syncScriptPath, 0o755); // Make executable
    }
}
exports.GitIntegration = GitIntegration;
//# sourceMappingURL=GitIntegration.js.map