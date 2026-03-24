import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useWorktreeStore } from '../../stores/worktree.store';
import { WorktreeCard } from './WorktreeCard';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';
import { IconButton } from '../shared/IconButton';

export function WorktreeList() {
  const { worktrees, isLoading, refresh, remove } = useWorktreeStore();
  const [showCreate, setShowCreate] = useState(false);

  const handleRemove = async (path: string) => {
    try {
      await remove(path);
    } catch {
      // Could show error toast
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-[var(--text-muted)]">
          {worktrees.length} worktree{worktrees.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-0.5">
          <IconButton
            icon={RefreshCw}
            size={12}
            title="Refresh"
            onClick={refresh}
            className={isLoading ? 'animate-spin' : ''}
          />
          <IconButton
            icon={Plus}
            size={12}
            title="New worktree"
            onClick={() => setShowCreate(true)}
          />
        </div>
      </div>

      {worktrees.map((wt) => (
        <WorktreeCard
          key={wt.path}
          worktree={wt}
          onRemove={() => handleRemove(wt.path)}
        />
      ))}

      {worktrees.length === 0 && !isLoading && (
        <div className="px-2 text-xs text-[var(--text-muted)]">
          No worktrees found
        </div>
      )}

      {showCreate && <CreateWorktreeDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
