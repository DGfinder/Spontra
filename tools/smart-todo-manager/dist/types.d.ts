export interface Todo {
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    estimatedHours?: number;
    actualHours?: number;
    dependencies?: string[];
    blockedBy?: string[];
    parentId?: string;
    childIds?: string[];
    filePaths?: string[];
    commitHashes?: string[];
    sessionId?: string;
    completionPatterns?: CompletionPattern[];
    lastDetectionRun?: Date;
}
export interface CompletionPattern {
    type: 'file_exists' | 'file_contains' | 'commit_message' | 'build_success' | 'test_pass';
    pattern: string;
    confidence: number;
}
export interface ProjectTodos {
    sessionTodos: Todo[];
    projectTodos: Todo[];
    futureTodos: Todo[];
    archivedTodos: Todo[];
}
export interface TodoSyncResult {
    added: Todo[];
    updated: Todo[];
    completed: Todo[];
    conflicts: TodoConflict[];
}
export interface TodoConflict {
    todoId: string;
    type: 'status_mismatch' | 'content_changed' | 'duplicate';
    sessionValue: any;
    projectValue: any;
    recommendation: 'use_session' | 'use_project' | 'merge' | 'manual_review';
}
export interface ProgressReport {
    totalTodos: number;
    completedTodos: number;
    completionRate: number;
    averageCompletionTime: number;
    velocity: number;
    estimatedCompletion: Date;
    blockedTodos: Todo[];
    upcomingTodos: Todo[];
    recentlyCompleted: Todo[];
}
export interface GitCommitInfo {
    hash: string;
    message: string;
    author: string;
    date: Date;
    changedFiles: string[];
}
export interface FileChangeInfo {
    path: string;
    action: 'added' | 'modified' | 'deleted';
    linesAdded: number;
    linesDeleted: number;
}
export interface SmartTodoConfig {
    projectRoot: string;
    futureTodoPath: string;
    todoDataPath: string;
    gitEnabled: boolean;
    autoDetectionEnabled: boolean;
    syncInterval: number;
    backupEnabled: boolean;
    maxArchiveSize: number;
}
export interface DetectionResult {
    todoId: string;
    detectionType: string;
    confidence: number;
    evidence: string;
    suggestedAction: 'mark_completed' | 'update_progress' | 'add_metadata';
}
export interface TodoAnalytics {
    completionTrends: {
        date: Date;
        completed: number;
        added: number;
    }[];
    categoryBreakdown: {
        category: string;
        total: number;
        completed: number;
    }[];
    priorityDistribution: {
        priority: string;
        count: number;
    }[];
    velocityHistory: {
        week: Date;
        completed: number;
        estimated: number;
    }[];
    bottlenecks: {
        reason: string;
        count: number;
        affectedTodos: string[];
    }[];
    timeAccuracy: {
        estimated: number;
        actual: number;
        accuracy: number;
    }[];
}
//# sourceMappingURL=types.d.ts.map