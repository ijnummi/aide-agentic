import type { LayoutTree } from './layout';
import type { ClaudeMessage, ClaudeSessionStatus } from './claude';

export interface PersistedTerminal {
  id: string;
  cwd: string;
  shell: string;
  title: string;
  scrollback: string;
}

export interface PersistedClaudeSession {
  id: string;
  claudeSessionId?: string;
  cwd: string;
  worktreeId?: string;
  messages: ClaudeMessage[];
  status: ClaudeSessionStatus;
  cost?: number;
}

export interface SessionState {
  version: 1;
  projectPath: string;
  savedAt: number;

  layout: LayoutTree | null;
  activePaneId: string;

  terminals: PersistedTerminal[];
  claudeSessions: PersistedClaudeSession[];

  ui: {
    sidebarVisible: boolean;
    sidebarWidth: number;
    activeSidebarPanel: string;
    theme: string;
  };

  worktreeAssignments: Record<string, string>;
}

export interface SessionMeta {
  projectPath: string;
  savedAt: number;
}

export interface PersistenceSchema {
  sessions: Record<string, SessionState>;
  recentProjects: Array<{ path: string; lastOpened: number }>;
}
