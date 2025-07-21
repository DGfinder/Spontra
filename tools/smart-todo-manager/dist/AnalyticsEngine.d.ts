import { ProjectTodos, TodoAnalytics } from './types';
export declare class AnalyticsEngine {
    generateAnalytics(projectTodos: ProjectTodos): TodoAnalytics;
    private calculateCompletionTrends;
    private calculateCategoryBreakdown;
    private calculatePriorityDistribution;
    private calculateVelocityHistory;
    private identifyBottlenecks;
    private calculateTimeAccuracy;
    private identifyBlockingReason;
    private findTodoById;
    private getWeekKey;
    private parseWeekKey;
    generateInsights(analytics: TodoAnalytics): string[];
}
//# sourceMappingURL=AnalyticsEngine.d.ts.map