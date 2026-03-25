import { Terminal, GitBranch } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminal.store';
import { useGitStore } from '../../stores/git.store';
import { useUIStore } from '../../stores/ui.store';
import { switchWorkspace } from '../../lib/workspace';
import { WorktreeSelector } from '../worktree/WorktreeSelector';

export function StatusBar() {
  const terminalCount = useTerminalStore((s) => s.terminals.size);
  const branch = useGitStore((s) => s.branch);
  const ahead = useGitStore((s) => s.ahead);
  const behind = useGitStore((s) => s.behind);
  const zoomLevel = useUIStore((s) => s.zoomLevel);
  const resetZoom = useUIStore((s) => s.resetZoom);

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
