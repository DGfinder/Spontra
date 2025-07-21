import { Todo } from './types';
/**
 * Integration layer between Claude Code's TodoWrite tool and Smart Todo Manager
 * This provides enhanced todo management capabilities for Claude Code sessions
 */
export declare class ClaudeCodeIntegration {
    private todoManager;
    private sessionTodos;
    private isInitialized;
    initialize(projectRoot?: string): Promise<void>;
    /**
     * Enhanced TodoWrite that integrates with Smart Todo Manager
     */
    writeSmartTodos(todos: Array<{
        content: string;
        status: 'pending' | 'in_progress' | 'completed';
        priority: 'low' | 'medium' | 'high';
        id: string;
    }>): Promise<{
        todos: Todo[];
        syncResult?: any;
        suggestions?: Todo[];
        progress?: any;
    }>;
    /**
     * Get contextual todo suggestions for Claude Code
     */
    getContextualSuggestions(currentFiles?: string[]): Promise<{
        suggestions: Todo[];
        insights: string[];
        upcomingDeadlines: Todo[];
    }>;
    /**
     * Mark a todo as completed with automatic detection
     */
    completeTodo(todoId: string, evidence?: string): Promise<{
        completedTodo: Todo;
        detectedCompletions: any[];
        updatedProgress: any;
    }>;
    /**
     * Promote session todos to project-level tracking
     */
    promoteToProject(todoIds: string[], category?: string): Promise<Todo[]>;
    /**
     * Generate session summary with smart insights
     */
    generateSessionSummary(): Promise<{
        completedThisSession: Todo[];
        addedThisSession: Todo[];
        suggestions: Todo[];
        progressUpdate: string;
        nextSessionRecommendations: string[];
    }>;
    /**
     * Auto-sync todos when Claude Code session ends
     */
    endSession(): Promise<void>;
    private getCurrentFileContext;
    /**
     * Format todos for Claude Code display
     */
    formatTodosForDisplay(todos: Todo[]): string;
    /**
     * Format progress for Claude Code display
     */
    formatProgressForDisplay(progress: any): string;
}
//# sourceMappingURL=ClaudeCodeIntegration.d.ts.map