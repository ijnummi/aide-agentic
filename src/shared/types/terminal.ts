export interface TerminalInstance {
  id: string;
  pid: number;
  cwd: string;
  shell: string;
  title: string;
  status: 'running' | 'exited';
  exitCode?: number;
  scrollback?: string;
  createdAt: number;
}

export interface PtyCreateRequest {
  id: string;
  cwd: string;
  shell?: string;
  args?: string[];
  cols: number;
  rows: number;
  env?: Record<string, string>;
}

export interface PtyCreateResponse {
  id: string;
  pid: number;
}

export interface PtyWriteRequest {
  id: string;
  data: string;
}

export interface PtyResizeRequest {
  id: string;
  cols: number;
  rows: number;
}

export interface PtyKillRequest {
  id: string;
}

export interface PtyDataEvent {
  id: string;
  data: string;
}

export interface PtyExitEvent {
  id: string;
  exitCode: number;
}
