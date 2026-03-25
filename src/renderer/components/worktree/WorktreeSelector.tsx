import { useState } from 'react';
import { GitFork, ChevronDown } from 'lucide-react';
import { useWorktreeStore } from '../../stores/worktree.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { baseName } from '../../lib/path';

interface WorktreeSelectorProps {
  onSelect?: (path: string) => void;
}

export function WorktreeSelector({ onSelect }: WorktreeSelectorProps) {
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const currentPath = useWorkspaceStore((s) => s.projectPath);
  const [open, setOpen] = useState(false);

  if (worktrees.length <= 1) return null;

  const current = worktrees.find((w) => w.path === currentPath);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-surface)]"
        onClick={() => setOpen(!open)}
      >
        <GitFork size={12} />
        <span>{current ? baseName(current.path) : `${worktrees.length} worktrees`}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 z-20 bg-[var(--bg-surface)] border border-[var(--border)] rounded shadow-lg min-w-[200px] max-h-48 overflow-y-auto">
            {worktrees.map((wt) => (
              <button
                key={wt.path}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-overlay)] ${wt.path === currentPath ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
                onClick={() => {
                  setOpen(false);
                  onSelect?.(wt.path);
                }}
              >
                <GitFork size={12} className={wt.isMain ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{baseName(wt.path)}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{wt.branch}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
