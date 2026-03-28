import { useEffect, useState, useRef } from 'react';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useClaudeStore } from '../../stores/claude.store';
import { useTerminalStore } from '../../stores/terminal.store';
import { getApi } from '../../lib/ipc';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { getSettings } from '../../stores/settings.store';
import { baseName } from '../../lib/path';

interface ClaudePanelProps {
  sessionId: string;
  cwd: string;
  isActive?: boolean;
}

interface SessionStats {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  messageCount: number;
}

export function ClaudePanel({ sessionId, cwd, isActive }: ClaudePanelProps) {
  const session = useClaudeStore((s) => s.sessions.get(sessionId));
  const claudeSessionId = session?.claudeSessionId;
  const terminals = useTerminalStore((s) => s.terminals);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const ptyCreated = useRef(false);

  // Use the session's stored cwd (scoped to its worktree), not the current workspace
  const sessionCwd = session?.cwd || cwd;

  // Spawn the claude CLI as a PTY (FitAddon will resize to actual size after mount)
  useEffect(() => {
    if (ptyCreated.current || !session) return;
    if (terminals.has(sessionId)) {
      ptyCreated.current = true;
      return;
    }

    ptyCreated.current = true;
    const args: string[] = [];
    if (claudeSessionId) {
      args.push('--resume', claudeSessionId);
    }

    getApi().pty.create({
      id: sessionId,
      cwd: sessionCwd,
      shell: 'claude',
      args,
      cols: 80,
      rows: 24,
    }).then((response) => {
      useTerminalStore.getState().registerTerminal({
        id: sessionId,
        pid: response.pid,
        cwd: sessionCwd,
        shell: 'claude',
        title: 'Claude',
        status: 'running',
        createdAt: Date.now(),
      });
    });
  }, [sessionId, session, claudeSessionId, sessionCwd, terminals]);

  // Watch the session JSONL for stats
  useEffect(() => {
    if (!claudeSessionId) return;
    const projectPath = useWorkspaceStore.getState().projectPath;
    getApi().claude.watch(projectPath, claudeSessionId);

    const unsub = getApi().claude.onStats((incoming) => {
      if (incoming.sessionId === claudeSessionId) {
        setStats({
          model: incoming.model,
          inputTokens: incoming.inputTokens,
          outputTokens: incoming.outputTokens,
          cacheCreationTokens: incoming.cacheCreationTokens,
          cacheReadTokens: incoming.cacheReadTokens,
          messageCount: incoming.messageCount,
        });
      }
    });

    return () => {
      getApi().claude.unwatch(claudeSessionId);
      unsub();
    };
  }, [claudeSessionId]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Session not found
      </div>
    );
  }

  const totalTokens = stats
    ? stats.inputTokens + stats.outputTokens + stats.cacheCreationTokens + stats.cacheReadTokens
    : 0;
  const contextMax = getSettings().claude.contextWindowSize;
  const contextPct = contextMax > 0 ? Math.min((totalTokens / contextMax) * 100, 100) : 0;
  const contextColor = contextPct < 50 ? 'var(--success)' : contextPct < 80 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex items-center gap-3 px-3 h-7 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] select-none">
        <span className="text-[var(--text-secondary)]">{baseName(sessionCwd)}</span>
        {stats?.model && (
          <span className="text-[var(--text-secondary)]">{stats.model.replace('claude-', '').replace(/-\d+$/, '')}</span>
        )}
        {stats && stats.messageCount > 0 && (
          <>
            <span title={`${totalTokens.toLocaleString()} tokens`}>
              <span style={{ color: contextColor }} className="font-medium">
                {contextPct.toFixed(0)}%
              </span>
              {' ctx'}
            </span>
            <span>↑{stats.inputTokens.toLocaleString()} ↓{stats.outputTokens.toLocaleString()}</span>
            <span>{stats.messageCount} msgs</span>
          </>
        )}
      </div>

      {/* Terminal running claude CLI */}
      <div className="flex-1 overflow-hidden">
        <TerminalPanel terminalId={sessionId} isActive={isActive} />
      </div>
    </div>
  );
}
