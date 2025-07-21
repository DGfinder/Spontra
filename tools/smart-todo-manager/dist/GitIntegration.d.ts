import { GitCommitInfo, FileChangeInfo } from './types';
export declare class GitIntegration {
    private projectRoot;
    constructor(projectRoot: string);
    setupHooks(): Promise<void>;
    getRecentCommits(since: Date, maxCount?: number): Promise<GitCommitInfo[]>;
    getCommitDetails(commitHash: string): Promise<GitCommitInfo | null>;
    getFileChanges(commitHash: string): Promise<FileChangeInfo[]>;
    getCurrentBranch(): Promise<string>;
    getUncommittedChanges(): Promise<string[]>;
    hasUncommittedChanges(): Promise<boolean>;
    searchCommitMessages(pattern: string, since?: Date, maxCount?: number): Promise<GitCommitInfo[]>;
    getCommitsAffectingFiles(filePaths: string[], since?: Date): Promise<GitCommitInfo[]>;
    checkFileExists(filePath: string): Promise<boolean>;
    getFileContent(filePath: string): Promise<string | null>;
    private parseGitLogOutput;
    private createPostCommitHook;
    private createPrePushHook;
    createDetectionScript(): Promise<void>;
}
//# sourceMappingURL=GitIntegration.d.ts.map