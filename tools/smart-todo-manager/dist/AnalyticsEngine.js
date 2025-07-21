"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsEngine = void 0;
class AnalyticsEngine {
    generateAnalytics(projectTodos) {
        const allTodos = [
            ...projectTodos.projectTodos,
            ...projectTodos.archivedTodos,
            ...projectTodos.futureTodos
        ];
        return {
            completionTrends: this.calculateCompletionTrends(allTodos),
            categoryBreakdown: this.calculateCategoryBreakdown(allTodos),
            priorityDistribution: this.calculatePriorityDistribution(allTodos),
            velocityHistory: this.calculateVelocityHistory(allTodos),
            bottlenecks: this.identifyBottlenecks(projectTodos),
            timeAccuracy: this.calculateTimeAccuracy(allTodos)
        };
    }
    calculateCompletionTrends(todos) {
        const trends = new Map();
        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Initialize all dates with 0
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            trends.set(dateKey, { completed: 0, added: 0 });
        }
        // Count completions and additions
        for (const todo of todos) {
            // Count additions
            if (todo.createdAt >= startDate && todo.createdAt <= endDate) {
                const dateKey = todo.createdAt.toISOString().split('T')[0];
                const entry = trends.get(dateKey);
                if (entry) {
                    entry.added++;
                }
            }
            // Count completions
            if (todo.completedAt && todo.completedAt >= startDate && todo.completedAt <= endDate) {
                const dateKey = todo.completedAt.toISOString().split('T')[0];
                const entry = trends.get(dateKey);
                if (entry) {
                    entry.completed++;
                }
            }
        }
        return Array.from(trends.entries()).map(([dateStr, data]) => ({
            date: new Date(dateStr),
            completed: data.completed,
            added: data.added
        }));
    }
    calculateCategoryBreakdown(todos) {
        const categories = new Map();
        for (const todo of todos) {
            const category = todo.category || 'uncategorized';
            if (!categories.has(category)) {
                categories.set(category, { total: 0, completed: 0 });
            }
            const entry = categories.get(category);
            entry.total++;
            if (todo.status === 'completed') {
                entry.completed++;
            }
        }
        return Array.from(categories.entries()).map(([category, data]) => ({
            category,
            total: data.total,
            completed: data.completed
        })).sort((a, b) => b.total - a.total);
    }
    calculatePriorityDistribution(todos) {
        const priorities = new Map();
        for (const todo of todos) {
            const priority = todo.priority;
            priorities.set(priority, (priorities.get(priority) || 0) + 1);
        }
        return Array.from(priorities.entries()).map(([priority, count]) => ({
            priority,
            count
        })).sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) -
                (priorityOrder[a.priority] || 0);
        });
    }
    calculateVelocityHistory(todos) {
        const velocity = new Map();
        // Get last 12 weeks
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        // Initialize weeks
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
            const weekKey = this.getWeekKey(d);
            velocity.set(weekKey, { completed: 0, estimated: 0 });
        }
        // Count completed todos by week
        const completedTodos = todos.filter(t => t.status === 'completed' && t.completedAt);
        for (const todo of completedTodos) {
            if (todo.completedAt >= startDate && todo.completedAt <= endDate) {
                const weekKey = this.getWeekKey(todo.completedAt);
                const entry = velocity.get(weekKey);
                if (entry) {
                    entry.completed++;
                }
            }
        }
        // Calculate estimated velocity (simple moving average)
        const velocityEntries = Array.from(velocity.entries()).sort(([a], [b]) => a.localeCompare(b));
        for (let i = 0; i < velocityEntries.length; i++) {
            const [weekKey, data] = velocityEntries[i];
            // Calculate 4-week moving average for estimation
            const lookbackWeeks = Math.min(4, i + 1);
            const recentCompleted = velocityEntries
                .slice(Math.max(0, i - lookbackWeeks + 1), i + 1)
                .reduce((sum, [, weekData]) => sum + weekData.completed, 0);
            data.estimated = Math.round(recentCompleted / lookbackWeeks);
        }
        return velocityEntries.map(([weekKey, data]) => ({
            week: this.parseWeekKey(weekKey),
            completed: data.completed,
            estimated: data.estimated
        }));
    }
    identifyBottlenecks(projectTodos) {
        const bottlenecks = new Map();
        // Analyze blocked todos
        const blockedTodos = projectTodos.projectTodos.filter(t => t.status === 'blocked');
        for (const todo of blockedTodos) {
            const reason = this.identifyBlockingReason(todo, projectTodos);
            if (!bottlenecks.has(reason)) {
                bottlenecks.set(reason, []);
            }
            bottlenecks.get(reason).push(todo.id);
        }
        // Analyze long-running todos
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const stuckTodos = projectTodos.projectTodos.filter(t => t.status === 'in_progress' && t.updatedAt < oneWeekAgo);
        if (stuckTodos.length > 0) {
            bottlenecks.set('Long-running tasks (>1 week)', stuckTodos.map(t => t.id));
        }
        // Analyze high priority pending todos
        const urgentPending = projectTodos.projectTodos.filter(t => t.status === 'pending' &&
            (t.priority === 'critical' || t.priority === 'high') &&
            t.createdAt < oneWeekAgo);
        if (urgentPending.length > 0) {
            bottlenecks.set('High priority pending tasks', urgentPending.map(t => t.id));
        }
        return Array.from(bottlenecks.entries()).map(([reason, affectedTodos]) => ({
            reason,
            count: affectedTodos.length,
            affectedTodos
        })).sort((a, b) => b.count - a.count);
    }
    calculateTimeAccuracy(todos) {
        const accuracy = [];
        const completedWithEstimates = todos.filter(t => t.status === 'completed' &&
            t.estimatedHours &&
            t.actualHours &&
            t.estimatedHours > 0 &&
            t.actualHours > 0);
        for (const todo of completedWithEstimates) {
            const estimated = todo.estimatedHours;
            const actual = todo.actualHours;
            const accuracyPercent = Math.min(estimated / actual, actual / estimated) * 100;
            accuracy.push({
                estimated,
                actual,
                accuracy: accuracyPercent
            });
        }
        return accuracy.sort((a, b) => b.accuracy - a.accuracy);
    }
    identifyBlockingReason(todo, projectTodos) {
        // Check dependencies
        if (todo.dependencies && todo.dependencies.length > 0) {
            const incompleteDeps = todo.dependencies.filter(depId => {
                const depTodo = this.findTodoById(depId, projectTodos);
                return depTodo && depTodo.status !== 'completed';
            });
            if (incompleteDeps.length > 0) {
                return `Waiting for ${incompleteDeps.length} dependency/dependencies`;
            }
        }
        // Check for common blocking patterns in content
        const content = todo.content.toLowerCase();
        if (content.includes('review') || content.includes('approval')) {
            return 'Waiting for review/approval';
        }
        if (content.includes('deploy') || content.includes('production')) {
            return 'Deployment/infrastructure dependencies';
        }
        if (content.includes('external') || content.includes('third-party')) {
            return 'External dependencies';
        }
        if (content.includes('design') || content.includes('mockup')) {
            return 'Waiting for design/specifications';
        }
        return 'Unknown blocking reason';
    }
    findTodoById(id, projectTodos) {
        return [
            ...projectTodos.projectTodos,
            ...projectTodos.archivedTodos,
            ...projectTodos.futureTodos
        ].find(t => t.id === id);
    }
    getWeekKey(date) {
        // Get the Monday of the week containing this date
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        d.setDate(diff);
        return d.toISOString().split('T')[0];
    }
    parseWeekKey(weekKey) {
        return new Date(weekKey);
    }
    // Generate insights based on analytics
    generateInsights(analytics) {
        const insights = [];
        // Velocity insights
        const recentVelocity = analytics.velocityHistory.slice(-4);
        const avgVelocity = recentVelocity.reduce((sum, week) => sum + week.completed, 0) / recentVelocity.length;
        if (avgVelocity < 2) {
            insights.push('🐌 Velocity is low - consider breaking down large tasks into smaller ones');
        }
        else if (avgVelocity > 10) {
            insights.push('🚀 High velocity! Great momentum on task completion');
        }
        // Completion rate insights
        const categories = analytics.categoryBreakdown;
        for (const category of categories) {
            const completionRate = category.total > 0 ? category.completed / category.total : 0;
            if (completionRate < 0.5 && category.total > 5) {
                insights.push(`⚠️ Low completion rate in ${category.category} (${(completionRate * 100).toFixed(0)}%)`);
            }
        }
        // Bottleneck insights
        if (analytics.bottlenecks.length > 0) {
            const topBottleneck = analytics.bottlenecks[0];
            insights.push(`🚧 Main bottleneck: ${topBottleneck.reason} (${topBottleneck.count} tasks affected)`);
        }
        // Time accuracy insights
        if (analytics.timeAccuracy.length > 5) {
            const avgAccuracy = analytics.timeAccuracy.reduce((sum, item) => sum + item.accuracy, 0) / analytics.timeAccuracy.length;
            if (avgAccuracy < 60) {
                insights.push('⏱️ Time estimates are often inaccurate - consider improving estimation process');
            }
            else if (avgAccuracy > 85) {
                insights.push('🎯 Excellent time estimation accuracy!');
            }
        }
        // Priority distribution insights
        const highPriorityCount = analytics.priorityDistribution.find(p => p.priority === 'high')?.count || 0;
        const totalTasks = analytics.priorityDistribution.reduce((sum, p) => sum + p.count, 0);
        if (highPriorityCount / totalTasks > 0.4) {
            insights.push('📈 Too many high-priority tasks - consider re-prioritizing');
        }
        return insights;
    }
}
exports.AnalyticsEngine = AnalyticsEngine;
//# sourceMappingURL=AnalyticsEngine.js.map