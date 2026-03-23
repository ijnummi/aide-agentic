import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type {
  PtyCreateRequest,
  PtyCreateResponse,
  PtyWriteRequest,
  PtyResizeRequest,
  PtyKillRequest,
  PtyDataEvent,
  PtyExitEvent,
} from '../shared/types/terminal';
import type { ShellInfo } from '../shared/types/ipc';
import type {
  ClaudeStartRequest,
  ClaudeStopRequest,
  ClaudeStreamEvent,
  ClaudeStatusEvent,
} from '../shared/types/claude';
import type {
  GitStatusResponse,
  GitLogEntry,
  GitDiffRequest,
} from '../shared/types/git';
import type {
  WorktreeInfo,
  WorktreeAddRequest,
  WorktreeRemoveRequest,
} from '../shared/types/worktree';
import type {
  PullRequest,
  PRDetail,
  GitHubPRsRequest,
  GitHubPRDetailRequest,
  GitHubPRReviewRequest,
  GitHubPRCommentRequest,
} from '../shared/types/github';
import type { SessionState, SessionMeta } from '../shared/types/persistence';

contextBridge.exposeInMainWorld('aide', {
  pty: {
    create(req: PtyCreateRequest): Promise<PtyCreateResponse> {
      return ipcRenderer.invoke(IPC.PTY_CREATE, req);
    },
    write(req: PtyWriteRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.PTY_WRITE, req);
    },
    resize(req: PtyResizeRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.PTY_RESIZE, req);
    },
    kill(req: PtyKillRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.PTY_KILL, req);
    },
    onData(callback: (event: PtyDataEvent) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: PtyDataEvent) => callback(data);
      ipcRenderer.on(IPC.PTY_DATA, handler);
      return () => ipcRenderer.removeListener(IPC.PTY_DATA, handler);
    },
    onExit(callback: (event: PtyExitEvent) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: PtyExitEvent) => callback(data);
      ipcRenderer.on(IPC.PTY_EXIT, handler);
      return () => ipcRenderer.removeListener(IPC.PTY_EXIT, handler);
    },
  },

  claude: {
    start(req: ClaudeStartRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.CLAUDE_START, req);
    },
    stop(req: ClaudeStopRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.CLAUDE_STOP, req);
    },
    onEvent(callback: (event: ClaudeStreamEvent) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: ClaudeStreamEvent) => callback(data);
      ipcRenderer.on(IPC.CLAUDE_EVENT, handler);
      return () => ipcRenderer.removeListener(IPC.CLAUDE_EVENT, handler);
    },
    onStatus(callback: (event: ClaudeStatusEvent) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: ClaudeStatusEvent) => callback(data);
      ipcRenderer.on(IPC.CLAUDE_STATUS, handler);
      return () => ipcRenderer.removeListener(IPC.CLAUDE_STATUS, handler);
    },
  },

  git: {
    status(cwd: string): Promise<GitStatusResponse> {
      return ipcRenderer.invoke(IPC.GIT_STATUS, cwd);
    },
    diff(req: GitDiffRequest): Promise<string> {
      return ipcRenderer.invoke(IPC.GIT_DIFF, req);
    },
    log(cwd: string, count?: number): Promise<GitLogEntry[]> {
      return ipcRenderer.invoke(IPC.GIT_LOG, cwd, count);
    },
    stage(cwd: string, files: string[]): Promise<void> {
      return ipcRenderer.invoke(IPC.GIT_STAGE, cwd, files);
    },
    commit(cwd: string, message: string): Promise<void> {
      return ipcRenderer.invoke(IPC.GIT_COMMIT, cwd, message);
    },
    branches(cwd: string): Promise<string[]> {
      return ipcRenderer.invoke(IPC.GIT_BRANCHES, cwd);
    },
    checkout(cwd: string, branch: string): Promise<void> {
      return ipcRenderer.invoke(IPC.GIT_CHECKOUT, cwd, branch);
    },
  },

  worktree: {
    list(cwd: string): Promise<WorktreeInfo[]> {
      return ipcRenderer.invoke(IPC.WORKTREE_LIST, cwd);
    },
    add(req: WorktreeAddRequest): Promise<WorktreeInfo> {
      return ipcRenderer.invoke(IPC.WORKTREE_ADD, req);
    },
    remove(req: WorktreeRemoveRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.WORKTREE_REMOVE, req);
    },
    prune(cwd: string): Promise<void> {
      return ipcRenderer.invoke(IPC.WORKTREE_PRUNE, cwd);
    },
  },

  github: {
    authenticate(token: string): Promise<{ ok: boolean }> {
      return ipcRenderer.invoke(IPC.GITHUB_AUTH, { token });
    },
    listPRs(req: GitHubPRsRequest): Promise<PullRequest[]> {
      return ipcRenderer.invoke(IPC.GITHUB_PRS, req);
    },
    getPRDetail(req: GitHubPRDetailRequest): Promise<PRDetail> {
      return ipcRenderer.invoke(IPC.GITHUB_PR_DETAIL, req);
    },
    getPRDiff(cwd: string, number: number): Promise<string> {
      return ipcRenderer.invoke(IPC.GITHUB_PR_DIFF, cwd, number);
    },
    submitReview(req: GitHubPRReviewRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.GITHUB_PR_REVIEW, req);
    },
    addComment(req: GitHubPRCommentRequest): Promise<void> {
      return ipcRenderer.invoke(IPC.GITHUB_PR_COMMENT, req);
    },
  },

  session: {
    save(state: SessionState): Promise<void> {
      return ipcRenderer.invoke(IPC.SESSION_SAVE, state);
    },
    load(projectPath: string): Promise<SessionState | null> {
      return ipcRenderer.invoke(IPC.SESSION_LOAD, projectPath);
    },
    list(): Promise<SessionMeta[]> {
      return ipcRenderer.invoke(IPC.SESSION_LIST);
    },
  },

  window: {
    minimize(): Promise<void> {
      return ipcRenderer.invoke('window:minimize');
    },
    maximize(): Promise<void> {
      return ipcRenderer.invoke('window:maximize');
    },
    close(): Promise<void> {
      return ipcRenderer.invoke('window:close');
    },
    isMaximized(): Promise<boolean> {
      return ipcRenderer.invoke('window:isMaximized');
    },
  },

  shell: {
    info(): Promise<ShellInfo> {
      return ipcRenderer.invoke(IPC.SHELL_INFO);
    },
    openExternal(url: string): Promise<void> {
      return ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url);
    },
  },
});
