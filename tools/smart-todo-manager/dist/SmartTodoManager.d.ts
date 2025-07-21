import { Todo, TodoSyncResult, ProgressReport, SmartTodoConfig, DetectionResult, TodoAnalytics, GitCommitInfo } from './types';
export declare class SmartTodoManager {
    private config;
    private projectTodos;
    private futureTodoParser;
    private gitIntegration;
    private completionDetector;
    private analyticsEngine;
    private lastSyncTime;
    constructor(config: SmartTodoConfig);
    initialize(): Promise<void>;
    syncSessionTodos(sessionTodos: Todo[]): Promise<TodoSyncResult>;
    promoteSessionTodoToProject(todoId: string, category?: string): Promise<Todo>;
    runCompletionDetection(): Promise<DetectionResult[]>;
    markTodoCompleted(todoId: string, reason?: string): Promise<Todo>;
    generateProgressReport(): Promise<ProgressReport>;
    getAnalytics(): Promise<TodoAnalytics>;
    syncToFutureTodoMd(): Promise<void>;
    loadFutureTodos(): Promise<void>;
    getSmartSuggestions(currentContext?: {
        filePaths?: string[];
        recentCommits?: GitCommitInfo[];
    }): Promise<Todo[]>;
    private findTodoById;
    private convertSessionTodoToProject;
    private generateCompletionPatterns;
    private extractFilePathFromContent;
    private extractKeywordsFromContent;
    private mergeTodos;
    private getUpcomingTodos;
    private isTodoUnblocked;
    private updateDependentTodos;
    private loadProjectTodos;
    private saveProjectTodos;
    private dateReplacer;
    private dateReviver;
}
//# sourceMappingURL=SmartTodoManager.d.ts.map