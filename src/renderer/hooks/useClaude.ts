import { useClaudeStore } from '../stores/claude.store';

export function useClaude() {
  const store = useClaudeStore();

  const startSession = (cwd: string) => {
    return store.createSession(cwd);
  };

  return { startSession };
}
