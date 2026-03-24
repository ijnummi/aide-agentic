import { Terminal, Bot, GitBranch, GitFork, Github, Plus, FolderOpen } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminal.store';
import { useClaudeStore } from '../../stores/claude.store';
import { useGitStore } from '../../stores/git.store';
import { useWorktreeStore } from '../../stores/worktree.store';
import { useGitHubStore } from '../../stores/github.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { useLayoutStore } from '../../stores/layout.store';
import { useClaude } from '../../hooks/useClaude';
import { getApi } from '../../lib/ipc';
import { switchWorkspace } from '../../lib/workspace';
import { claudeName } from '../../lib/names';
import type { TabItem } from '../../../shared/types/layout';
import { useEffect, useState } from 'react';

interface HomePanelProps {
  cwd: string;
}

export function HomePanel({ cwd }: HomePanelProps) {
  const terminals = useTerminalStore((s) => s.terminals);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const claudeSessions = useClaudeStore((s) => s.sessions);
  const gitBranch = useGitStore((s) => s.branch);
  const gitStaged = useGitStore((s) => s.staged);
  const gitUnstaged = useGitStore((s) => s.unstaged);
  const gitUntracked = useGitStore((s) => s.untracked);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const ghPRs = useGitHubStore((s) => s.prs);
  const ghAuth = useGitHubStore((s) => s.isAuthenticated);
  const projectName = useWorkspaceStore((s) => s.projectName);
  const projectPath = useWorkspaceStore((s) => s.projectPath);
  const addTab = useLayoutStore((s) => s.addTab);
  const focusOrAddTab = useLayoutStore((s) => s.focusOrAddTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const { startSession } = useClaude();

  const terminalList = Array.from(terminals.values()).filter((t) => t.cwd === projectPath);
  const claudeList = Array.from(claudeSessions.values()).filter((s) => s.cwd === projectPath);
  const totalChanges = gitStaged.length + gitUnstaged.length + gitUntracked.length;

  const handleNewTerminal = async () => {
    const id = await createTerminal(cwd);
    const tab: TabItem = {
      id,
      type: 'terminal',
      title: useTerminalStore.getState().getTitle(id),
      metadata: { terminalId: id },
    };
    addTab(activePaneId, tab);
  };

  const handleNewClaude = () => {
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: claudeName(),
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  };

  const handleFocusTerminal = (id: string) => {
    const tab: TabItem = {
      id,
      type: 'terminal',
      title: useTerminalStore.getState().getTitle(id),
      metadata: { terminalId: id },
    };
    focusOrAddTab(activePaneId, tab);
  };

  const handleFocusClaude = (id: string) => {
    const session = claudeSessions.get(id);
    const tab: TabItem = {
      id,
      type: 'claude',
      title: session ? `Claude` : 'Claude',
      metadata: { sessionId: id },
    };
    focusOrAddTab(activePaneId, tab);
  };

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto">
      {/* Project header */}
      <div className="flex items-center gap-2">
        <FolderOpen size={18} className="text-[var(--accent)]" />
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{projectName}</div>
          <div className="text-xs text-[var(--text-muted)]">{projectPath}</div>
        </div>
      </div>

      {/* Quick stats */}
      {gitBranch && (
        <div className="flex flex-col gap-1 text-xs">
          <Stat icon={GitBranch} label={gitBranch} color="var(--accent)" />
          <Stat icon={GitBranch} label={`${totalChanges} change${totalChanges !== 1 ? 's' : ''}`} color={totalChanges > 0 ? 'var(--warning)' : 'var(--text-muted)'} />
          <Stat icon={GitFork} label={`${worktrees.length} worktree${worktrees.length !== 1 ? 's' : ''}`} color="var(--text-secondary)" />
          {ghAuth && (
            <Stat icon={Github} label={`${ghPRs.length} PRs`} color="var(--text-secondary)" />
          )}
        </div>
      )}

      {/* Terminals */}
      <Section
        icon={Terminal}
        title="Terminals"
        count={terminalList.length}
        onAdd={handleNewTerminal}
      >
        {terminalList.map((t) => (
          <ItemRow
            key={t.id}
            icon={Terminal}
            label={t.title}
            sublabel={`pid ${t.pid}`}
            status={t.status === 'running' ? 'var(--success)' : 'var(--text-muted)'}
            onClick={() => handleFocusTerminal(t.id)}
          />
        ))}
        {terminalList.length === 0 && <Empty>No terminals open</Empty>}
      </Section>

      {/* Claude Sessions */}
      <Section
        icon={Bot}
        title="Claude Sessions"
        count={claudeList.length}
        onAdd={handleNewClaude}
      >
        {claudeList.map((s) => (
          <ItemRow
            key={s.id}
            icon={Bot}
            label={s.cwd.split('/').pop() || 'Session'}
            sublabel={s.model || 'default model'}
            status={
              s.status === 'running' ? 'var(--accent)' :
              s.status === 'error' ? 'var(--error)' :
              s.status === 'waiting' ? 'var(--success)' : 'var(--text-muted)'
            }
            onClick={() => handleFocusClaude(s.id)}
          />
        ))}
        {claudeList.length === 0 && <Empty>No Claude sessions</Empty>}
      </Section>

      {/* Worktrees */}
      {worktrees.length > 0 && (
        <Section icon={GitFork} title="Worktrees" count={worktrees.length}>
          {worktrees.map((wt) => (
            <ItemRow
              key={wt.path}
              icon={GitFork}
              label={wt.path.split('/').pop() || wt.path}
              sublabel={wt.branch}
              status={wt.path === projectPath ? 'var(--accent)' : 'var(--text-muted)'}
              onDoubleClick={() => switchWorkspace(wt.path)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  onAdd,
  children,
}: {
  icon: typeof Terminal;
  title: string;
  count: number;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-[var(--text-muted)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        <span className="text-xs text-[var(--text-muted)]">({count})</span>
        <div className="flex-1" />
        {onAdd && (
          <button
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-[var(--accent)] hover:bg-[var(--bg-surface)]"
            onClick={onAdd}
          >
            <Plus size={12} />
            New
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5 ml-1">{children}</div>
    </div>
  );
}

function ItemRow({
  icon: Icon,
  label,
  sublabel,
  status,
  onClick,
  onDoubleClick,
}: {
  icon: typeof Terminal;
  label: string;
  sublabel?: string;
  status?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[var(--bg-surface)] w-full"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: status || 'var(--text-muted)' }}
      />
      <span className="text-sm text-[var(--text-primary)] truncate">{label}</span>
      {sublabel && (
        <span className="text-xs text-[var(--text-muted)] truncate">{sublabel}</span>
      )}
    </button>
  );
}

function Stat({ icon: Icon, label, color }: { icon: typeof Terminal; label: string; color: string }) {
  return (
    <span className="flex items-center gap-1" style={{ color }}>
      <Icon size={12} />
      <span>{label}</span>
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-[var(--text-muted)] px-2 py-1">{children}</div>;
}
