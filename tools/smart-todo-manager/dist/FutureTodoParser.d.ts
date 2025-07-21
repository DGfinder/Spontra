import { Todo } from './types';
export declare class FutureTodoParser {
    private futureTodoPath;
    constructor(futureTodoPath: string);
    parseFutureTodos(): Promise<Todo[]>;
    updateFutureTodoMd(futureTodos: Todo[], projectTodos: Todo[], archivedTodos: Todo[]): Promise<void>;
    private parseMarkdownTodos;
    private parseMarkdownStructure;
    private updateTodoStatuses;
    private addProgressTracking;
    private extractCategory;
    private extractPriorityFromSection;
    private extractFilePathsFromContent;
    private generateIdFromContent;
    private simpleHash;
    private calculateAverageCompletionTime;
    private getUpcomingTasks;
    private createEmptyFutureTodoFile;
}
//# sourceMappingURL=FutureTodoParser.d.ts.map