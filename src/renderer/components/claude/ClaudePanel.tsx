import { useCallback } from 'react';
import { ClaudeChat } from './ClaudeChat';
import { ClaudeInput } from './ClaudeInput';
import { AgentStatusBadge } from './AgentStatusBadge';
import { useClaudeStore } from '../../stores/claude.store';
import { useClaude } from '../../hooks/useClaude';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useState } from 'react';

interface ClaudePanelProps {
  sessionId: string;
  cwd: string;
  isActive?: boolean;
}

export function ClaudePanel({ sessionId, cwd, isActive }: ClaudePanelProps) {
  const session = useClaudeStore((s) => s.sessions.get(sessionId));
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
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-3">
          <AgentStatusBadge status={session.status} />
          {session.cost !== undefined && (
            <span className="text-[var(--text-muted)]">
              ${session.cost.toFixed(4)}
            </span>
          )}
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
