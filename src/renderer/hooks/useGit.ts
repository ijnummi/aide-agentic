import { useEffect, useRef } from 'react';
import { useGitStore } from '../stores/git.store';

const POLL_INTERVAL = 5000;

export function useGit(cwd: string) {
  const setCwd = useGitStore((s) => s.setCwd);
  const refresh = useGitStore((s) => s.refresh);
  const refreshBranches = useGitStore((s) => s.refreshBranches);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cwd) return;
    setCwd(cwd);
    refresh();
    refreshBranches();

    intervalRef.current = setInterval(() => {
      refresh();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cwd, setCwd, refresh, refreshBranches]);
}
