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
exports.FutureTodoParser = void 0;
const fs = __importStar(require("fs/promises"));
class FutureTodoParser {
    constructor(futureTodoPath) {
        this.futureTodoPath = futureTodoPath;
    }
    async parseFutureTodos() {
        try {
            const content = await fs.readFile(this.futureTodoPath, 'utf-8');
            return this.parseMarkdownTodos(content);
        }
        catch (error) {
            console.log('FUTURE_TODO.md not found, creating empty file');
            await this.createEmptyFutureTodoFile();
            return [];
        }
    }
    async updateFutureTodoMd(futureTodos, projectTodos, archivedTodos) {
        try {
            // Read current content to preserve structure and comments
            const currentContent = await fs.readFile(this.futureTodoPath, 'utf-8');
            // Parse the structure
            const sections = this.parseMarkdownStructure(currentContent);
            // Update todo statuses in each section
            const updatedContent = this.updateTodoStatuses(currentContent, [...projectTodos, ...archivedTodos]);
            // Add progress tracking section
            const contentWithProgress = this.addProgressTracking(updatedContent, projectTodos, archivedTodos);
            await fs.writeFile(this.futureTodoPath, contentWithProgress);
        }
        catch (error) {
            console.error('Error updating FUTURE_TODO.md:', error);
        }
    }
    parseMarkdownTodos(content) {
        const todos = [];
        const lines = content.split('\n');
        let currentSection = '';
        let currentCategory = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Detect sections (## Phase 1, ### Creator Dashboard, etc.)
            if (line.startsWith('##')) {
                currentSection = line.replace(/^#+\s*/, '');
                currentCategory = this.extractCategory(currentSection);
                continue;
            }
            // Parse todo items
            const todoMatch = line.match(/^-\s*\[\s*([x\s])\s*\]\s*(.+)$/);
            if (todoMatch) {
                const [, status, content] = todoMatch;
                const isCompleted = status.toLowerCase() === 'x';
                const todo = {
                    id: this.generateIdFromContent(content),
                    content: content.trim(),
                    status: isCompleted ? 'completed' : 'pending',
                    priority: this.extractPriorityFromSection(currentSection),
                    category: currentCategory,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: ['future-todo'],
                    filePaths: this.extractFilePathsFromContent(content)
                };
                if (isCompleted) {
                    todo.completedAt = new Date();
                }
                todos.push(todo);
            }
        }
        return todos;
    }
    parseMarkdownStructure(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Detect section headers
            const headerMatch = line.match(/^(#{2,4})\s*(.+)$/);
            if (headerMatch) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section
                currentSection = {
                    level: headerMatch[1].length,
                    title: headerMatch[2].trim(),
                    startLine: i,
                    endLine: i,
                    todos: [],
                    content: []
                };
            }
            if (currentSection) {
                currentSection.endLine = i;
                currentSection.content.push(line);
                // Parse todos in this section
                const todoMatch = line.match(/^-\s*\[\s*([x\s])\s*\]\s*(.+)$/);
                if (todoMatch) {
                    currentSection.todos.push({
                        lineNumber: i,
                        status: todoMatch[1].toLowerCase() === 'x' ? 'completed' : 'pending',
                        content: todoMatch[2].trim(),
                        originalLine: line
                    });
                }
            }
        }
        // Add final section
        if (currentSection) {
            sections.push(currentSection);
        }
        return sections;
    }
    updateTodoStatuses(content, allTodos) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const todoMatch = line.match(/^(\s*-\s*\[)\s*([x\s])\s*(\]\s*)(.+)$/);
            if (todoMatch) {
                const [, prefix, currentStatus, suffix, todoContent] = todoMatch;
                // Find matching todo in our managed todos
                const matchingTodo = allTodos.find(todo => this.generateIdFromContent(todoContent.trim()) === todo.id ||
                    todo.content.toLowerCase().includes(todoContent.trim().toLowerCase()) ||
                    todoContent.trim().toLowerCase().includes(todo.content.toLowerCase()));
                if (matchingTodo) {
                    const newStatus = matchingTodo.status === 'completed' ? 'x' : ' ';
                    // Add progress indicator for in-progress todos
                    let progressIndicator = '';
                    if (matchingTodo.status === 'in_progress') {
                        progressIndicator = ' 🔄';
                    }
                    else if (matchingTodo.status === 'blocked') {
                        progressIndicator = ' ⛔';
                    }
                    else if (matchingTodo.status === 'completed') {
                        progressIndicator = '';
                    }
                    lines[i] = `${prefix}${newStatus}${suffix}${todoContent}${progressIndicator}`;
                    // Add completion date for completed todos
                    if (matchingTodo.status === 'completed' && matchingTodo.completedAt && !todoContent.includes('✓')) {
                        const completedDate = matchingTodo.completedAt.toISOString().split('T')[0];
                        lines[i] += ` ✓ ${completedDate}`;
                    }
                }
            }
        }
        return lines.join('\n');
    }
    addProgressTracking(content, projectTodos, archivedTodos) {
        // Find or create progress section
        const progressSectionMarker = '## 📊 Progress Tracking';
        if (!content.includes(progressSectionMarker)) {
            // Add progress section at the end
            content += `\n\n${progressSectionMarker}\n\n`;
        }
        // Calculate statistics
        const totalTodos = projectTodos.length + archivedTodos.length;
        const completedTodos = archivedTodos.filter(t => t.status === 'completed').length;
        const inProgressTodos = projectTodos.filter(t => t.status === 'in_progress').length;
        const blockedTodos = projectTodos.filter(t => t.status === 'blocked').length;
        const completionRate = totalTodos > 0 ? (completedTodos / totalTodos * 100).toFixed(1) : '0';
        // Get recent activity
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentlyCompleted = archivedTodos.filter(t => t.completedAt && t.completedAt > oneWeekAgo).length;
        const progressSection = `
${progressSectionMarker}

*Last updated: ${new Date().toLocaleString()}*

### Current Status
- **Total Tasks**: ${totalTodos}
- **Completed**: ${completedTodos} (${completionRate}%)
- **In Progress**: ${inProgressTodos}
- **Blocked**: ${blockedTodos}
- **Pending**: ${projectTodos.filter(t => t.status === 'pending').length}

### Recent Activity
- **Completed this week**: ${recentlyCompleted} tasks
- **Average completion time**: ${this.calculateAverageCompletionTime(archivedTodos)} days

### Progress Chart
\`\`\`
${'█'.repeat(Math.floor(parseFloat(completionRate) / 5))}${'░'.repeat(20 - Math.floor(parseFloat(completionRate) / 5))} ${completionRate}%
\`\`\`

### Upcoming High Priority Tasks
${this.getUpcomingTasks(projectTodos).map(todo => `- ${todo.content}`).join('\n')}

### Recently Completed
${archivedTodos
            .filter(t => t.completedAt && t.completedAt > oneWeekAgo)
            .slice(0, 5)
            .map(todo => `- ✅ ${todo.content} (${todo.completedAt?.toLocaleDateString()})`)
            .join('\n')}
`;
        // Replace existing progress section or add new one
        const progressRegex = new RegExp(`${progressSectionMarker}[\\s\\S]*?(?=^## |$)`, 'm');
        if (progressRegex.test(content)) {
            return content.replace(progressRegex, progressSection.trim());
        }
        else {
            return content + progressSection;
        }
    }
    extractCategory(sectionTitle) {
        const title = sectionTitle.toLowerCase();
        if (title.includes('phase 1') || title.includes('deployment'))
            return 'deployment';
        if (title.includes('phase 2') || title.includes('creator') || title.includes('community'))
            return 'community';
        if (title.includes('phase 3') || title.includes('feature'))
            return 'features';
        if (title.includes('phase 4') || title.includes('business') || title.includes('analytics'))
            return 'business';
        if (title.includes('backend'))
            return 'backend';
        if (title.includes('frontend'))
            return 'frontend';
        if (title.includes('mobile'))
            return 'mobile';
        if (title.includes('security'))
            return 'security';
        if (title.includes('performance'))
            return 'performance';
        return 'general';
    }
    extractPriorityFromSection(sectionTitle) {
        const title = sectionTitle.toLowerCase();
        if (title.includes('critical') || title.includes('phase 1'))
            return 'critical';
        if (title.includes('high') || title.includes('phase 2'))
            return 'high';
        if (title.includes('medium') || title.includes('phase 3'))
            return 'medium';
        return 'low';
    }
    extractFilePathsFromContent(content) {
        const filePaths = [];
        // Match file extensions
        const fileMatches = content.match(/[\w\/\.-]+\.(ts|tsx|js|jsx|go|py|md|json|css|scss|yaml|yml)/g);
        if (fileMatches) {
            filePaths.push(...fileMatches);
        }
        // Match common path patterns
        const pathMatches = content.match(/src\/[\w\/\.-]+|components\/[\w\/\.-]+|services\/[\w\/\.-]+/g);
        if (pathMatches) {
            filePaths.push(...pathMatches);
        }
        return filePaths;
    }
    generateIdFromContent(content) {
        // Generate a consistent ID based on content
        const normalized = content.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
        return `future-${normalized.slice(0, 30)}-${this.simpleHash(content)}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).slice(0, 8);
    }
    calculateAverageCompletionTime(completedTodos) {
        const todosWithTimes = completedTodos.filter(t => t.completedAt && t.createdAt);
        if (todosWithTimes.length === 0)
            return 'N/A';
        const totalDays = todosWithTimes.reduce((sum, todo) => {
            const days = (todo.completedAt.getTime() - todo.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);
        return (totalDays / todosWithTimes.length).toFixed(1);
    }
    getUpcomingTasks(projectTodos) {
        return projectTodos
            .filter(t => t.status === 'pending' && t.priority === 'high')
            .slice(0, 5);
    }
    async createEmptyFutureTodoFile() {
        const emptyContent = `# Project Todo List

## Current Sprint

- [ ] Add your todos here

## Backlog

- [ ] Future tasks

## Completed

- [x] Example completed task

## 📊 Progress Tracking

*Auto-generated section - will be updated automatically*
`;
        await fs.writeFile(this.futureTodoPath, emptyContent);
    }
}
exports.FutureTodoParser = FutureTodoParser;
//# sourceMappingURL=FutureTodoParser.js.map