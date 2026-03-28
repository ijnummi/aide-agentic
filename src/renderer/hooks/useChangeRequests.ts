import { useEffect } from 'react';
import { useChangeRequestStore } from '../stores/change-request.store';
import { useWorktreeStore } from '../stores/worktree.store';
import { useWorkspaceStore } from '../stores/workspace.store';

export function useChangeRequests() {
  const setCwd = useChangeRequestStore((s) => s.setCwd);
  const refresh = useChangeRequestStore((s) => s.refresh);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const projectPath = useWorkspaceStore((s) => s.projectPath);

  // Use main worktree path if available, otherwise fall back to project path
  const mainPath = worktrees.find((w) => w.isMain)?.path || projectPath;

  useEffect(() => {
    if (!mainPath) return;
    setCwd(mainPath);
    refresh();
  }, [mainPath, setCwd, refresh]);
}
