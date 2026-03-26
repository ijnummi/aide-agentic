import { useEffect } from 'react';
import { useDocsStore } from '../stores/docs.store';

export function useDocs(cwd: string) {
  const setCwd = useDocsStore((s) => s.setCwd);
  const refresh = useDocsStore((s) => s.refresh);

  useEffect(() => {
    if (!cwd) return;
    setCwd(cwd);
    refresh();
  }, [cwd, setCwd, refresh]);
}
