import { create } from 'zustand';
import type { GitStatusResponse, FileChange, DiffFile, GitLogEntry } from '../../shared/types/git';
import { getApi } from '../lib/ipc';
import { parseDiff } from '../lib/diff-parser';
import { DEFAULT_SETTINGS } from '../../shared/settings';

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
  log: GitLogEntry[];
  isLoading: boolean;
  lastUpdated: number;

  setCwd: (cwd: string) => void;
  refresh: () => Promise<void>;
  refreshBranches: () => Promise<void>;
  refreshLog: () => Promise<void>;
  stage: (files: string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  revertAll: () => Promise<void>;
  getDiff: (staged?: boolean, file?: string) => Promise<DiffFile[]>;
  getCommitDiff: (hash: string) => Promise<DiffFile[]>;
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
  log: [],
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
      get().refreshLog();
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

  refreshLog: async () => {
    const { cwd } = get();
    if (!cwd) return;
    try {
      const log = await getApi().git.log(cwd, DEFAULT_SETTINGS.git.logCount);
      set({ log });
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

  getCommitDiff: async (hash) => {
    const { cwd } = get();
    const raw = await getApi().git.show(cwd, hash);
    return parseDiff(raw);
  },
}));
