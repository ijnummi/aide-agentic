import { useState } from 'react';
import { Terminal, GitBranch, Trash2, Undo2 } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminal.store';
import { useGitStore } from '../../stores/git.store';
import { useUIStore } from '../../stores/ui.store';
import { useWorktreeStore } from '../../stores/worktree.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { switchWorkspace } from '../../lib/workspace';
import { WorktreeSelector } from '../worktree/WorktreeSelector';

export function StatusBar() {
  const terminalCount = useTerminalStore((s) => s.terminals.size);
  const branch = useGitStore((s) => s.branch);
  const ahead = useGitStore((s) => s.ahead);
  const behind = useGitStore((s) => s.behind);
  const staged = useGitStore((s) => s.staged);
  const unstaged = useGitStore((s) => s.unstaged);
  const untracked = useGitStore((s) => s.untracked);
  const revertAll = useGitStore((s) => s.revertAll);
  const zoomLevel = useUIStore((s) => s.zoomLevel);
  const resetZoom = useUIStore((s) => s.resetZoom);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const projectPath = useWorkspaceStore((s) => s.projectPath);
  const removeWorktree = useWorktreeStore((s) => s.remove);

  const currentWorktree = worktrees.find((wt) => wt.path === projectPath);
  const isNonMain = currentWorktree && !currentWorktree.isMain;
  const hasChanges = staged.length > 0 || unstaged.length > 0 || untracked.length > 0;
  const [busy, setBusy] = useState(false);

  const handleRevertAll = async () => {
    if (!hasChanges) return;
    setBusy(true);
    try {
      await revertAll();
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteWorktree = async () => {
    if (!currentWorktree || hasChanges) return;
    const mainWorktree = worktrees.find((wt) => wt.isMain);
    if (!mainWorktree) return;
    setBusy(true);
    try {
      await switchWorkspace(mainWorktree.path);
      await removeWorktree(currentWorktree.path);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center h-6 px-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-[var(--text-muted)] text-xs select-none">
      {branch && (
        <div className="flex items-center gap-1 mr-3">
          <GitBranch size={12} />
          <span>{branch}</span>
          {(ahead > 0 || behind > 0) && (
            <span>
              {ahead > 0 && `↑${ahead}`}
              {behind > 0 && `↓${behind}`}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-1">
        <Terminal size={12} />
        <span>{terminalCount}</span>
      </div>
      <WorktreeSelector onSelect={switchWorkspace} />

      {/* Worktree actions — only for non-main worktrees */}
      {isNonMain && (
        <div className="flex items-center gap-1 ml-2">
          <button
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--warning)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-default"
            onClick={handleRevertAll}
            disabled={!hasChanges || busy}
            title="Revert all changes (tracked + untracked)"
          >
            <Undo2 size={11} />
            <span>Revert</span>
          </button>
          <button
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--error)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-default"
            onClick={handleDeleteWorktree}
            disabled={hasChanges || busy}
            title={hasChanges ? 'Revert all changes before deleting' : 'Delete this worktree'}
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>
        </div>
      )}

      <div className="flex-1" />
      {zoomLevel !== 100 && (
        <button
          className="px-1.5 rounded hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          onClick={resetZoom}
          title="Reset zoom to 100%"
        >
          {zoomLevel}%
        </button>
      )}
      <span>AIDE v0.1.0</span>
    </div>
  );
}
