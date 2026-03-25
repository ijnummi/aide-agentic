import { GitFork, Trash2 } from 'lucide-react';
import type { WorktreeInfo } from '../../../shared/types/worktree';
import { baseName } from '../../lib/path';
import { IconButton } from '../shared/IconButton';

interface WorktreeCardProps {
  worktree: WorktreeInfo;
  onRemove: () => void;
}

export function WorktreeCard({ worktree, onRemove }: WorktreeCardProps) {
  const dirName = baseName(worktree.path);

  return (
    <div className="flex items-center gap-2.5 px-2 py-2 hover:bg-[var(--bg-surface)] rounded group">
      <GitFork size={18} className={worktree.isMain ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text-primary)] truncate">{dirName}</div>
        <div className="text-xs text-[var(--text-muted)] truncate">
          {worktree.branch}
          {worktree.head && ` · ${worktree.head.slice(0, 7)}`}
        </div>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
        {!worktree.isMain && (
          <IconButton icon={Trash2} size={12} title="Remove worktree" onClick={onRemove} />
        )}
      </div>
    </div>
  );
}
