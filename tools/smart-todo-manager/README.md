# Smart Todo Manager

An intelligent todo tracking and completion detection system that bridges session-based development and long-term project planning.

## Features

### 🎯 **Automatic Completion Detection**
- Analyzes git commits to detect completed todos
- File creation and modification tracking
- Commit message pattern matching
- Build and test success detection

### 📊 **Progress Analytics**
- Velocity tracking and forecasting
- Category and priority breakdowns
- Bottleneck identification
- Time estimation accuracy analysis

### 🔄 **Session Integration**
- Syncs Claude Code session todos with project-level tracking
- Cross-session todo continuity
- Smart suggestions based on current context

### 📋 **FUTURE_TODO.md Sync**
- Automatic synchronization with markdown todo files
- Progress tracking with completion dates
- Visual progress bars and statistics

### 🚀 **Git Integration**
- Automatic git hooks for completion detection
- Commit-based todo completion tracking
- File change analysis

## Installation

```bash
cd tools/smart-todo-manager
npm install
npm run build
```

## Quick Start

### 1. Initialize in your project
```bash
smart-todo init
```

### 2. Sync session todos
```bash
smart-todo sync --session session-todos.json
```

### 3. Run completion detection
```bash
smart-todo detect --auto-complete
```

### 4. View progress
```bash
smart-todo progress
```

## Commands

### `smart-todo sync`
Sync session todos with project todos
- `--session <file>`: Session todos file (JSON format)
- `--format <format>`: Output format (json|table)

### `smart-todo detect`
Run completion detection on pending todos
- `--auto-complete`: Automatically complete high-confidence detections
- `--threshold <number>`: Confidence threshold for auto-completion (default: 0.9)

### `smart-todo progress`
Generate comprehensive progress report
- `--format <format>`: Output format (json|table)

### `smart-todo analytics`
Generate todo analytics and insights
- `--format <format>`: Output format (json|table)

### `smart-todo suggest`
Get smart todo suggestions based on context
- `--files <files>`: Current file context (comma-separated)
- `--count <number>`: Number of suggestions (default: 5)

### `smart-todo list`
List all todos with filtering
- `--status <status>`: Filter by status (pending|in_progress|completed|blocked)
- `--priority <priority>`: Filter by priority (low|medium|high|critical)
- `--category <category>`: Filter by category
- `--limit <number>`: Limit results (default: 20)

### `smart-todo complete <todoId>`
Mark a todo as completed
- `--reason <reason>`: Reason for completion

### `smart-todo init`
Initialize smart todo manager in current project
- `--git-hooks`: Set up git hooks for automatic detection (default: true)

## Configuration

The Smart Todo Manager uses a configuration file or default settings:

```typescript
interface SmartTodoConfig {
  projectRoot: string              // Project root directory
  futureTodoPath: string          // Path to FUTURE_TODO.md
  todoDataPath: string            // Path to persistent todo data
  gitEnabled: boolean             // Enable git integration
  autoDetectionEnabled: boolean   // Enable automatic completion detection
  syncInterval: number            // Sync interval in minutes
  backupEnabled: boolean          // Enable automatic backups
  maxArchiveSize: number          // Maximum archived todos
}
```

## Todo Format

Todos are tracked with rich metadata:

```typescript
interface Todo {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  tags?: string[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  
  // Time tracking
  estimatedHours?: number
  actualHours?: number
  
  // Relationships
  dependencies?: string[]
  blockedBy?: string[]
  parentId?: string
  childIds?: string[]
  
  // Context
  filePaths?: string[]
  commitHashes?: string[]
  sessionId?: string
  
  // Auto-detection
  completionPatterns?: CompletionPattern[]
}
```

## Completion Detection

The system automatically detects completed todos through:

### 1. **File Creation Patterns**
```
Todo: "Create UserService component"
Detection: src/services/UserService.ts created
Confidence: 85%
```

### 2. **Commit Message Analysis**
```
Todo: "Implement authentication system" 
Commit: "implement JWT authentication with login/logout"
Confidence: 90%
```

### 3. **File Content Analysis**
```
Todo: "Add error handling to API calls"
Detection: try/catch blocks added to API files
Confidence: 75%
```

### 4. **Build/Test Success**
```
Todo: "Set up CI/CD pipeline"
Detection: Build passing commit message
Confidence: 95%
```

## Claude Code Integration

For Claude Code users, the Smart Todo Manager provides enhanced TodoWrite functionality:

```typescript
import { ClaudeCodeIntegration } from './ClaudeCodeIntegration'

const integration = new ClaudeCodeIntegration()
await integration.initialize()

// Enhanced todo writing with smart features
const result = await integration.writeSmartTodos([
  { content: "Add user authentication", status: "pending", priority: "high", id: "auth-1" }
])

// Get contextual suggestions
const suggestions = await integration.getContextualSuggestions(['src/auth.ts'])

// Generate session summary
const summary = await integration.generateSessionSummary()
```

## Analytics and Insights

The system provides comprehensive analytics:

### **Velocity Tracking**
- Todos completed per week
- Trend analysis and forecasting
- Velocity-based completion estimates

### **Category Analysis**
- Completion rates by category
- Time allocation insights
- Bottleneck identification

### **Time Accuracy**
- Estimation vs actual time tracking
- Improvement recommendations
- Project planning insights

### **Bottleneck Detection**
- Blocked todo analysis
- Dependency chain identification
- Resource allocation suggestions

## FUTURE_TODO.md Integration

The system automatically maintains your FUTURE_TODO.md file:

```markdown
## Phase 1: Deployment (Month 1-2)

- [x] Deploy UGC service to production ✓ 2024-01-15
- [ ] Set up cloud storage for video uploads 🔄
- [ ] Configure content moderation pipeline

## 📊 Progress Tracking

*Last updated: 2024-01-20 14:30:00*

### Current Status
- **Total Tasks**: 45
- **Completed**: 23 (51.1%)
- **In Progress**: 8
- **Blocked**: 2
- **Pending**: 12

### Recent Activity
- **Completed this week**: 5 tasks
- **Average completion time**: 3.2 days

### Progress Chart
```
██████████░░░░░░░░░░ 51.1%
```
```

## Git Hooks

Automatic git hooks are set up during initialization:

### **post-commit hook**
```bash
#!/bin/bash
# Run completion detection after each commit
node tools/smart-todo-manager/scripts/detect-completion.js --commit $(git rev-parse HEAD)
```

### **pre-push hook**
```bash
#!/bin/bash
# Sync todos before pushing
node tools/smart-todo-manager/scripts/sync-todos.js --pre-push
```

## API Reference

### Core Classes

- **`SmartTodoManager`**: Main orchestration class
- **`FutureTodoParser`**: FUTURE_TODO.md parsing and updating
- **`GitIntegration`**: Git operations and hook management
- **`CompletionDetector`**: Automatic completion detection
- **`AnalyticsEngine`**: Progress analytics and insights
- **`ClaudeCodeIntegration`**: Claude Code TodoWrite enhancement

### Key Methods

```typescript
// Initialize system
await todoManager.initialize()

// Sync session todos
const result = await todoManager.syncSessionTodos(sessionTodos)

// Run completion detection
const detections = await todoManager.runCompletionDetection()

// Generate progress report
const progress = await todoManager.generateProgressReport()

// Get smart suggestions
const suggestions = await todoManager.getSmartSuggestions(context)

// Mark todo completed
const completed = await todoManager.markTodoCompleted(todoId, reason)
```

## Examples

### Basic Usage
```bash
# Initialize in project
smart-todo init

# Add some todos to FUTURE_TODO.md or session
smart-todo sync --session my-todos.json

# Work on code, make commits...
git commit -m "implement user authentication system"

# Check for auto-detected completions
smart-todo detect
# Output: 🎯 Detected 1 potential completion:
#         Commit "implement user authentication system" matches pattern (95% confidence)

# View progress
smart-todo progress
# Output: 📊 Progress Report:
#         📋 Total todos: 25
#         ✅ Completed: 12 (48.0%)
#         ⚡ Velocity: 3 todos/week
```

### Advanced Analytics
```bash
# Get detailed analytics
smart-todo analytics
# Output: 📈 Todo Analytics:
#         📂 Category Breakdown:
#           backend: 8/15 (53%)
#           frontend: 6/10 (60%)
#         🚧 Bottlenecks:
#           Waiting for review/approval: 3 affected todos

# Get smart suggestions based on current work
smart-todo suggest --files "src/auth.ts,src/user.ts"
# Output: 💡 Smart Suggestions (3):
#         1. [HIGH] Add password validation to UserService
#         2. [MEDIUM] Implement session timeout handling
#         3. [HIGH] Add unit tests for authentication flow
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.