import { Todo, DetectionResult, GitCommitInfo, CompletionPattern } from './types';
import { GitIntegration } from './GitIntegration';
export declare class CompletionDetector {
    private gitIntegration;
    constructor(gitIntegration: GitIntegration);
    checkTodoCompletion(todo: Todo, recentCommits: GitCommitInfo[]): Promise<DetectionResult | null>;
    private checkPattern;
    private checkFileExistsPattern;
    private checkFileContainsPattern;
    private checkCommitMessagePattern;
    private checkBuildSuccessPattern;
    private checkTestPassPattern;
    private heuristicDetection;
    private calculateCommitRelevance;
    private detectCreationCompletion;
    private extractKeywords;
    private extractCreationTarget;
    private getFileName;
    private isBuildSuccessCommit;
    private isTestPassCommit;
    generateCompletionPatterns(todo: Todo): CompletionPattern[];
}
//# sourceMappingURL=CompletionDetector.d.ts.map