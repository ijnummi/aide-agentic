import { useEffect, useRef } from 'react';
import { useGitStore } from '../stores/git.store';
import { getSettings } from '../stores/settings.store';

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
    }, getSettings().timing.gitPollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cwd, setCwd, refresh, refreshBranches]);
}
