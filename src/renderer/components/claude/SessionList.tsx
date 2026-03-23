import { Bot, Plus, X } from 'lucide-react';
import { useClaudeStore } from '../../stores/claude.store';
import { AgentStatusBadge } from './AgentStatusBadge';

interface SessionListProps {
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function SessionList({ onSelectSession, onNewSession }: SessionListProps) {
  const sessions = useClaudeStore((s) => s.sessions);
  const activeSessionId = useClaudeStore((s) => s.activeSessionId);
  const removeSession = useClaudeStore((s) => s.removeSession);

  const sessionList = Array.from(sessions.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs text-[var(--text-muted)]">
          {sessionList.length} session{sessionList.length !== 1 ? 's' : ''}
        </span>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded text-[var(--accent)] hover:bg-[var(--bg-surface)] transition-colors"
          onClick={onNewSession}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessionList.map((session) => (
          <button
            key={session.id}
            className={`flex items-center gap-2 w-full px-2 py-2 text-left text-xs transition-colors ${
              session.id === activeSessionId
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <Bot size={14} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">
                {session.cwd.split('/').pop() || 'Session'}
              </div>
              <AgentStatusBadge status={session.status} />
            </div>
            <span
              className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-overlay)]"
              onClick={(e) => {
                e.stopPropagation();
                removeSession(session.id);
              }}
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
