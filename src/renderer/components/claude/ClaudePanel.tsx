import { useCallback } from 'react';
import { ClaudeChat } from './ClaudeChat';
import { ClaudeInput } from './ClaudeInput';
import { AgentStatusBadge } from './AgentStatusBadge';
import { useClaudeStore } from '../../stores/claude.store';
import { useGitStore } from '../../stores/git.store';
import { useClaude } from '../../hooks/useClaude';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useState } from 'react';

const MODELS = [
  { id: 'claude-sonnet-4-5-20250514', label: 'Sonnet 4.5' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
];

interface ClaudePanelProps {
  sessionId: string;
  cwd: string;
  isActive?: boolean;
}

export function ClaudePanel({ sessionId, cwd, isActive }: ClaudePanelProps) {
  const session = useClaudeStore((s) => s.sessions.get(sessionId));
  const setModel = useClaudeStore((s) => s.setModel);
  const gitBranch = useGitStore((s) => s.branch);
  const gitStaged = useGitStore((s) => s.staged);
  const gitUnstaged = useGitStore((s) => s.unstaged);
  const { sendMessage, stopSession } = useClaude();
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  const handleSend = useCallback(
    (prompt: string) => {
      sendMessage(sessionId, prompt);
    },
    [sessionId, sendMessage],
  );

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Session not found
      </div>
    );
  }

  const isInputDisabled = session.status === 'running' || session.status === 'starting';

  return (
    <div className="flex flex-col h-full">
      {/* Header / Status Line */}
      <div className="flex items-center justify-between px-3 h-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2">
          <AgentStatusBadge status={session.status} />
          <select
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-1.5 py-0.5 border border-[var(--border)] outline-none"
            value={session.model || ''}
            onChange={(e) => setModel(sessionId, e.target.value || '')}
            disabled={session.status === 'running'}
          >
            <option value="">Default</option>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <span className="text-[var(--text-muted)]">|</span>
          {/* Path */}
          <span className="text-[var(--text-secondary)]">
            .../{session.cwd.split('/').pop()}
          </span>
          {/* Branch + diff stats */}
          {gitBranch && (
            <>
              <span className="text-[var(--text-muted)]">|</span>
              <span className="text-[var(--accent)]">⎇ {gitBranch}</span>
              {(gitStaged.length > 0 || gitUnstaged.length > 0) && (
                <span>
                  <span className="text-[var(--text-muted)]">(</span>
                  <span className="text-[var(--success)]">+{gitStaged.length}</span>
                  <span className="text-[var(--text-muted)]">,</span>
                  <span className="text-[var(--warning)]">~{gitUnstaged.length}</span>
                  <span className="text-[var(--text-muted)]">)</span>
                </span>
              )}
            </>
          )}
          {/* Worktree indicator */}
          {session.worktreeId && (
            <>
              <span className="text-[var(--text-muted)]">𖠰</span>
              <span className="text-[var(--text-secondary)]">{session.worktreeId.split('/').pop()}</span>
            </>
          )}
          {/* Context usage */}
          <span className="text-[var(--text-muted)]">|</span>
          <ContextPct used={session.totalInputTokens + session.totalOutputTokens} max={200_000} />
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              viewMode === 'structured'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setViewMode('structured')}
          >
            Chat
          </button>
          <button
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              viewMode === 'raw'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setViewMode('raw')}
          >
            Terminal
          </button>
          {session.status === 'running' && (
            <button
              className="ml-2 px-2 py-0.5 rounded text-xs text-[var(--error)] hover:bg-[var(--bg-surface)]"
              onClick={() => stopSession(sessionId)}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'structured' ? (
        <>
          <div className="flex-1 overflow-hidden">
            <ClaudeChat messages={session.messages} />
          </div>
          <ClaudeInput
            onSend={handleSend}
            disabled={isInputDisabled}
            placeholder={
              session.status === 'running'
                ? 'Claude is working...'
                : 'Send a message to Claude...'
            }
          />
        </>
      ) : (
        <div className="flex-1 overflow-hidden">
          <TerminalPanel terminalId={sessionId} isActive={isActive} />
        </div>
      )}
    </div>
  );
}

function ContextPct({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const color = pct < 50 ? 'var(--success)' : pct < 80 ? 'var(--warning)' : 'var(--error)';

  return (
    <span
      style={{ color }}
      className="font-medium"
      title={`${used.toLocaleString()} / ${max.toLocaleString()} tokens`}
    >
      {pct.toFixed(1)}%
    </span>
  );
}
