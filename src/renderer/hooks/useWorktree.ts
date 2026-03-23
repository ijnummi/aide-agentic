import { useEffect } from 'react';
import { useWorktreeStore } from '../stores/worktree.store';

export function useWorktree(cwd: string) {
  const setCwd = useWorktreeStore((s) => s.setCwd);
  const refresh = useWorktreeStore((s) => s.refresh);

  useEffect(() => {
    if (!cwd) return;
    setCwd(cwd);
    refresh();
  }, [cwd, setCwd, refresh]);
}
