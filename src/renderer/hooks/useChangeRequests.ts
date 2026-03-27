import { useEffect } from 'react';
import { useChangeRequestStore } from '../stores/change-request.store';
import { useWorktreeStore } from '../stores/worktree.store';

export function useChangeRequests() {
  const setCwd = useChangeRequestStore((s) => s.setCwd);
  const refresh = useChangeRequestStore((s) => s.refresh);
  const worktrees = useWorktreeStore((s) => s.worktrees);

  // Always use the main worktree path so CRs are global
  const mainPath = worktrees.find((w) => w.isMain)?.path || '';

  useEffect(() => {
    if (!mainPath) return;
    setCwd(mainPath);
    refresh();
  }, [mainPath, setCwd, refresh]);
}
