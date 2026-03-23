import { create } from 'zustand';
import type { PullRequest, PRDetail } from '../../shared/types/github';
import { getApi } from '../lib/ipc';
import { parseDiff } from '../lib/diff-parser';
import type { DiffFile } from '../../shared/types/git';

interface GitHubStore {
  isAuthenticated: boolean;
  prs: PullRequest[];
  activePR: PRDetail | null;
  activePRDiff: DiffFile[];
  isLoading: boolean;
  error: string | null;

  authenticate: (token: string) => Promise<void>;
  loadPRs: (cwd: string, state?: 'open' | 'closed' | 'all') => Promise<void>;
  selectPR: (cwd: string, number: number) => Promise<void>;
  submitReview: (cwd: string, number: number, event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT', body: string) => Promise<void>;
  addComment: (cwd: string, number: number, body: string) => Promise<void>;
  clearActivePR: () => void;
}

export const useGitHubStore = create<GitHubStore>((set, get) => ({
  isAuthenticated: false,
  prs: [],
  activePR: null,
  activePRDiff: [],
  isLoading: false,
  error: null,

  authenticate: async (token) => {
    try {
      await getApi().github.authenticate(token);
      set({ isAuthenticated: true, error: null });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Auth failed' });
    }
  },

  loadPRs: async (cwd, state) => {
    set({ isLoading: true, error: null });
    try {
      const prs = await getApi().github.listPRs({ cwd, state });
      set({ prs });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load PRs' });
    } finally {
      set({ isLoading: false });
    }
  },

  selectPR: async (cwd, number) => {
    set({ isLoading: true, error: null });
    try {
      const [detail, rawDiff] = await Promise.all([
        getApi().github.getPRDetail({ cwd, number }),
        getApi().github.getPRDiff(cwd, number),
      ]);
      set({ activePR: detail, activePRDiff: parseDiff(rawDiff) });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load PR' });
    } finally {
      set({ isLoading: false });
    }
  },

  submitReview: async (cwd, number, event, body) => {
    await getApi().github.submitReview({ cwd, number, event, body });
    // Refresh PR detail
    await get().selectPR(cwd, number);
  },

  addComment: async (cwd, number, body) => {
    await getApi().github.addComment({ cwd, number, body });
    await get().selectPR(cwd, number);
  },

  clearActivePR: () => {
    set({ activePR: null, activePRDiff: [] });
  },
}));
