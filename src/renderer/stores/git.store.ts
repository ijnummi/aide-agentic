import { create } from 'zustand';
import type { GitStatusResponse, FileChange, DiffFile } from '../../shared/types/git';
import { getApi } from '../lib/ipc';
import { parseDiff } from '../lib/diff-parser';

interface GitStore {
  cwd: string;
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  branches: string[];
  isLoading: boolean;
  lastUpdated: number;

  setCwd: (cwd: string) => void;
  refresh: () => Promise<void>;
  refreshBranches: () => Promise<void>;
  stage: (files: string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  revertAll: () => Promise<void>;
  getDiff: (staged?: boolean, file?: string) => Promise<DiffFile[]>;
}

export const useGitStore = create<GitStore>((set, get) => ({
  cwd: '',
  branch: '',
  upstream: '',
  ahead: 0,
  behind: 0,
  staged: [],
  unstaged: [],
  untracked: [],
  branches: [],
  isLoading: false,
  lastUpdated: 0,

  setCwd: (cwd) => set({ cwd }),

  refresh: async () => {
    const { cwd } = get();
    if (!cwd) return;
    set({ isLoading: true });
    try {
      const status = await getApi().git.status(cwd);
      set({
        branch: status.branch,
        upstream: status.upstream || '',
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged,
        unstaged: status.unstaged,
        untracked: status.untracked,
        lastUpdated: Date.now(),
      });
    } catch {
      // Not a git repo or git not available
    } finally {
      set({ isLoading: false });
    }
  },

  refreshBranches: async () => {
    const { cwd } = get();
    if (!cwd) return;
    try {
      const branches = await getApi().git.branches(cwd);
      set({ branches });
    } catch {
      // ignore
    }
  },

  stage: async (files) => {
    const { cwd } = get();
    await getApi().git.stage(cwd, files);
    await get().refresh();
  },

  commit: async (message) => {
    const { cwd } = get();
    await getApi().git.commit(cwd, message);
    await get().refresh();
  },

  checkout: async (branch) => {
    const { cwd } = get();
    await getApi().git.checkout(cwd, branch);
    await get().refresh();
    await get().refreshBranches();
  },

  revertAll: async () => {
    const { cwd } = get();
    await getApi().git.revertAll(cwd);
    await get().refresh();
  },

  getDiff: async (staged, file) => {
    const { cwd } = get();
    const raw = await getApi().git.diff({ cwd, staged, file });
    return parseDiff(raw);
  },
}));
