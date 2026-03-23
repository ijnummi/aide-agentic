import { GitFork, Trash2, Bot } from 'lucide-react';
import type { WorktreeInfo } from '../../../shared/types/worktree';
import { IconButton } from '../shared/IconButton';

interface WorktreeCardProps {
  worktree: WorktreeInfo;
  onRemove: () => void;
  onAssignAgent: () => void;
}

export function WorktreeCard({ worktree, onRemove, onAssignAgent }: WorktreeCardProps) {
  const dirName = worktree.path.split('/').pop() || worktree.path;

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
      {worktree.assignedAgentId && (
        <span title="Agent assigned"><Bot size={16} className="text-[var(--accent)] flex-shrink-0" /></span>
      )}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
        {!worktree.assignedAgentId && (
          <IconButton icon={Bot} size={12} title="Assign Claude agent" onClick={onAssignAgent} />
        )}
        {!worktree.isMain && (
          <IconButton icon={Trash2} size={12} title="Remove worktree" onClick={onRemove} />
        )}
      </div>
    </div>
  );
}
