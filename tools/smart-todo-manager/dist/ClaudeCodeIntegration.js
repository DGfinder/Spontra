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
exports.ClaudeCodeIntegration = void 0;
const SmartTodoManager_1 = require("./SmartTodoManager");
const path = __importStar(require("path"));
/**
 * Integration layer between Claude Code's TodoWrite tool and Smart Todo Manager
 * This provides enhanced todo management capabilities for Claude Code sessions
 */
class ClaudeCodeIntegration {
    constructor() {
        this.todoManager = null;
        this.sessionTodos = [];
        this.isInitialized = false;
    }
    async initialize(projectRoot) {
        const root = projectRoot || process.cwd();
        const config = {
            projectRoot: root,
            futureTodoPath: path.join(root, 'FUTURE_TODO.md'),
            todoDataPath: path.join(root, '.todo-data', 'todos.json'),
            gitEnabled: true,
            autoDetectionEnabled: true,
            syncInterval: 60,
            backupEnabled: true,
            maxArchiveSize: 1000
        };
        this.todoManager = new SmartTodoManager_1.SmartTodoManager(config);
        await this.todoManager.initialize();
        this.isInitialized = true;
    }
    /**
     * Enhanced TodoWrite that integrates with Smart Todo Manager
     */
    async writeSmartTodos(todos) {
        if (!this.isInitialized || !this.todoManager) {
            await this.initialize();
        }
        // Convert TodoWrite format to Smart Todo format
        const smartTodos = todos.map(todo => ({
            ...todo,
            priority: todo.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: 'session',
            tags: ['claude-code', 'session'],
            completionPatterns: this.todoManager.completionDetector?.generateCompletionPatterns({
                content: todo.content,
                id: todo.id,
                status: todo.status,
                priority: todo.priority,
                createdAt: new Date(),
                updatedAt: new Date()
            }) || []
        }));
        this.sessionTodos = smartTodos;
        // Sync with project todos
        const syncResult = await this.todoManager.syncSessionTodos(smartTodos);
        // Get smart suggestions for next work
        const suggestions = await this.todoManager.getSmartSuggestions({
            filePaths: await this.getCurrentFileContext()
        });
        // Get progress update
        const progress = await this.todoManager.generateProgressReport();
        return {
            todos: smartTodos,
            syncResult,
            suggestions: suggestions.slice(0, 3),
            progress
        };
    }
    /**
     * Get contextual todo suggestions for Claude Code
     */
    async getContextualSuggestions(currentFiles) {
        if (!this.todoManager) {
            return { suggestions: [], insights: [], upcomingDeadlines: [] };
        }
        const context = currentFiles ? { filePaths: currentFiles } : undefined;
        const suggestions = await this.todoManager.getSmartSuggestions(context);
        const analytics = await this.todoManager.getAnalytics();
        const insights = this.todoManager.analyticsEngine.generateInsights(analytics);
        // Get upcoming high-priority todos as "deadlines"
        const progress = await this.todoManager.generateProgressReport();
        const upcomingDeadlines = progress.upcomingTodos.filter(t => t.priority === 'high' || t.priority === 'critical').slice(0, 5);
        return {
            suggestions: suggestions.slice(0, 5),
            insights: insights.slice(0, 3),
            upcomingDeadlines
        };
    }
    /**
     * Mark a todo as completed with automatic detection
     */
    async completeTodo(todoId, evidence) {
        if (!this.todoManager) {
            throw new Error('Smart Todo Manager not initialized');
        }
        const completedTodo = await this.todoManager.markTodoCompleted(todoId, evidence);
        // Run completion detection to find other potentially completed todos
        const detectedCompletions = await this.todoManager.runCompletionDetection();
        // Get updated progress
        const updatedProgress = await this.todoManager.generateProgressReport();
        return {
            completedTodo,
            detectedCompletions,
            updatedProgress
        };
    }
    /**
     * Promote session todos to project-level tracking
     */
    async promoteToProject(todoIds, category) {
        if (!this.todoManager) {
            throw new Error('Smart Todo Manager not initialized');
        }
        const promotedTodos = [];
        for (const todoId of todoIds) {
            try {
                const promoted = await this.todoManager.promoteSessionTodoToProject(todoId, category);
                promotedTodos.push(promoted);
            }
            catch (error) {
                console.warn(`Failed to promote todo ${todoId}:`, error);
            }
        }
        return promotedTodos;
    }
    /**
     * Generate session summary with smart insights
     */
    async generateSessionSummary() {
        if (!this.todoManager) {
            return {
                completedThisSession: [],
                addedThisSession: [],
                suggestions: [],
                progressUpdate: 'Smart Todo Manager not initialized',
                nextSessionRecommendations: []
            };
        }
        const sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
        const progress = await this.todoManager.generateProgressReport();
        const completedThisSession = progress.recentlyCompleted.filter(t => t.completedAt && t.completedAt > sessionStart);
        const addedThisSession = this.sessionTodos.filter(t => t.createdAt > sessionStart);
        const suggestions = await this.todoManager.getSmartSuggestions();
        const progressUpdate = `Completed ${completedThisSession.length} todos this session. ` +
            `Overall progress: ${progress.completedTodos}/${progress.totalTodos} (${(progress.completionRate * 100).toFixed(1)}%)`;
        const nextSessionRecommendations = [
            suggestions.length > 0 ? `Consider working on: ${suggestions[0].content}` : 'No high-priority tasks ready',
            progress.blockedTodos.length > 0 ? `Review ${progress.blockedTodos.length} blocked todos` : null,
            `Current velocity: ${progress.velocity} todos/week`
        ].filter(Boolean);
        return {
            completedThisSession,
            addedThisSession,
            suggestions: suggestions.slice(0, 3),
            progressUpdate,
            nextSessionRecommendations
        };
    }
    /**
     * Auto-sync todos when Claude Code session ends
     */
    async endSession() {
        if (!this.todoManager)
            return;
        try {
            // Final sync
            await this.todoManager.syncSessionTodos(this.sessionTodos);
            // Update FUTURE_TODO.md
            await this.todoManager.syncToFutureTodoMd();
            // Run final completion detection
            await this.todoManager.runCompletionDetection();
            console.log('✅ Smart todos synced successfully');
        }
        catch (error) {
            console.error('❌ Error ending smart todo session:', error);
        }
    }
    async getCurrentFileContext() {
        // In a real Claude Code integration, this would get the current files being worked on
        // For now, return empty array
        return [];
    }
    /**
     * Format todos for Claude Code display
     */
    formatTodosForDisplay(todos) {
        let output = '## 📋 Smart Todos\n\n';
        const todosByStatus = {
            pending: todos.filter(t => t.status === 'pending'),
            in_progress: todos.filter(t => t.status === 'in_progress'),
            completed: todos.filter(t => t.status === 'completed'),
            blocked: todos.filter(t => t.status === 'blocked')
        };
        for (const [status, statusTodos] of Object.entries(todosByStatus)) {
            if (statusTodos.length === 0)
                continue;
            const statusEmoji = {
                pending: '⏳',
                in_progress: '🔄',
                completed: '✅',
                blocked: '⛔'
            }[status] || '📋';
            output += `### ${statusEmoji} ${status.replace('_', ' ').toUpperCase()} (${statusTodos.length})\n\n`;
            for (const todo of statusTodos) {
                const priority = todo.priority.toUpperCase();
                const estimate = todo.estimatedHours ? ` (${todo.estimatedHours}h)` : '';
                output += `- **[${priority}]** ${todo.content}${estimate}\n`;
                if (todo.tags && todo.tags.length > 0) {
                    output += `  - *Tags: ${todo.tags.join(', ')}*\n`;
                }
            }
            output += '\n';
        }
        return output;
    }
    /**
     * Format progress for Claude Code display
     */
    formatProgressForDisplay(progress) {
        const completionRate = (progress.completionRate * 100).toFixed(1);
        const progressBar = '█'.repeat(Math.floor(progress.completionRate * 20)) +
            '░'.repeat(20 - Math.floor(progress.completionRate * 20));
        return `## 📊 Progress Update

**Overall Progress:** ${progress.completedTodos}/${progress.totalTodos} (${completionRate}%)
\`${progressBar}\` ${completionRate}%

**Velocity:** ${progress.velocity} todos/week
**Estimated Completion:** ${progress.estimatedCompletion.toDateString()}

${progress.blockedTodos.length > 0 ? `⚠️ **${progress.blockedTodos.length} blocked todos** need attention` : '✅ No blocked todos'}
`;
    }
}
exports.ClaudeCodeIntegration = ClaudeCodeIntegration;
//# sourceMappingURL=ClaudeCodeIntegration.js.map