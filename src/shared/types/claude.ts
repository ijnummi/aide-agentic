export type ClaudeSessionStatus = 'starting' | 'running' | 'waiting' | 'stopped' | 'error';

export interface ClaudeStartRequest {
  sessionId: string;
  cwd: string;
  prompt?: string;
  resume?: string;
  allowedTools?: string[];
}

export interface ClaudeSendRequest {
  sessionId: string;
  prompt: string;
}

export interface ClaudeStopRequest {
  sessionId: string;
}

export interface ClaudeStatusEvent {
  sessionId: string;
  status: ClaudeSessionStatus;
  error?: string;
}

// Stream-json event types from Claude Code CLI
export interface ClaudeStreamEvent {
  sessionId: string;
  event: ClaudeRawEvent;
}

export type ClaudeRawEvent =
  | { type: 'system'; subtype: string; message?: string }
  | { type: 'assistant'; message: ClaudeAPIMessage }
  | { type: 'result'; result: string; session_id: string; total_cost_usd?: number; duration_ms?: number; is_error?: boolean; num_turns?: number }
  | { type: 'error'; error: { message: string } };

export interface ClaudeAPIMessage {
  id: string;
  role: 'assistant';
  content: ClaudeContentBlock[];
  model?: string;
  stop_reason?: string;
}

export type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

// Renderer-side message model
export interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

export interface ClaudeToolUseBlock {
  type: 'tool_use';
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
  status: 'completed' | 'error';
  result?: string;
  isError?: boolean;
}

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  blocks: (ClaudeTextBlock | ClaudeToolUseBlock)[];
  timestamp: number;
}

export interface ClaudeSession {
  id: string;
  claudeSessionId?: string;
  cwd: string;
  worktreeId?: string;
  status: ClaudeSessionStatus;
  messages: ClaudeMessage[];
  cost?: number;
  error?: string;
  createdAt: number;
}
