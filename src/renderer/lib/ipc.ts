import type {
  PtyCreateRequest,
  PtyCreateResponse,
  PtyWriteRequest,
  PtyResizeRequest,
  PtyKillRequest,
  PtyDataEvent,
  PtyExitEvent,
} from '../../shared/types/terminal';
import type { ShellInfo } from '../../shared/types/ipc';
import type {
  ClaudeStartRequest,
  ClaudeStopRequest,
  ClaudeStreamEvent,
  ClaudeStatusEvent,
} from '../../shared/types/claude';
import type {
  GitStatusResponse,
  GitLogEntry,
  GitDiffRequest,
} from '../../shared/types/git';
import type {
  WorktreeInfo,
  WorktreeAddRequest,
  WorktreeRemoveRequest,
} from '../../shared/types/worktree';
import type {
  PullRequest,
  PRDetail,
  GitHubPRsRequest,
  GitHubPRDetailRequest,
  GitHubPRReviewRequest,
  GitHubPRCommentRequest,
} from '../../shared/types/github';
import type { SessionState, SessionMeta } from '../../shared/types/persistence';
import type {
  DocsDiscoverRequest,
  DocsDiscoverResponse,
  DocsReadRequest,
  DocsReadResponse,
} from '../../shared/types/docs';

export interface AideAPI {
  pty: {
    create(req: PtyCreateRequest): Promise<PtyCreateResponse>;
    write(req: PtyWriteRequest): Promise<void>;
    resize(req: PtyResizeRequest): Promise<void>;
    kill(req: PtyKillRequest): Promise<void>;
    onData(callback: (event: PtyDataEvent) => void): () => void;
    onExit(callback: (event: PtyExitEvent) => void): () => void;
  };
  claude: {
    start(req: ClaudeStartRequest): Promise<void>;
    stop(req: ClaudeStopRequest): Promise<void>;
    onEvent(callback: (event: ClaudeStreamEvent) => void): () => void;
    onStatus(callback: (event: ClaudeStatusEvent) => void): () => void;
    watch(projectPath: string, sessionId: string): Promise<void>;
    unwatch(sessionId: string): Promise<void>;
    onStats(callback: (stats: { sessionId: string; model: string; inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number; messageCount: number }) => void): () => void;
  };
  git: {
    status(cwd: string): Promise<GitStatusResponse>;
    diff(req: GitDiffRequest): Promise<string>;
    log(cwd: string, count?: number): Promise<GitLogEntry[]>;
    stage(cwd: string, files: string[]): Promise<void>;
    commit(cwd: string, message: string): Promise<void>;
    branches(cwd: string): Promise<string[]>;
    checkout(cwd: string, branch: string): Promise<void>;
    revertAll(cwd: string): Promise<void>;
  };
  worktree: {
    list(cwd: string): Promise<WorktreeInfo[]>;
    add(req: WorktreeAddRequest): Promise<WorktreeInfo>;
    remove(req: WorktreeRemoveRequest): Promise<void>;
    prune(cwd: string): Promise<void>;
  };
  github: {
    authenticate(token: string): Promise<{ ok: boolean }>;
    listPRs(req: GitHubPRsRequest): Promise<PullRequest[]>;
    getPRDetail(req: GitHubPRDetailRequest): Promise<PRDetail>;
    getPRDiff(cwd: string, number: number): Promise<string>;
    submitReview(req: GitHubPRReviewRequest): Promise<void>;
    addComment(req: GitHubPRCommentRequest): Promise<void>;
  };
  session: {
    save(state: SessionState): Promise<void>;
    load(projectPath: string): Promise<SessionState | null>;
    list(): Promise<SessionMeta[]>;
  };
  window: {
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
  };
  docs: {
    discover(req: DocsDiscoverRequest): Promise<DocsDiscoverResponse>;
    readFile(req: DocsReadRequest): Promise<DocsReadResponse>;
  };
  shell: {
    info(): Promise<ShellInfo>;
    openExternal(url: string): Promise<void>;
  };
}

declare global {
  interface Window {
    aide: AideAPI;
  }
}

export function getApi(): AideAPI {
  return window.aide;
}
