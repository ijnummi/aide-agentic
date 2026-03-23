import { create } from 'zustand';
import type { WorktreeInfo } from '../../shared/types/worktree';
import { getApi } from '../lib/ipc';

interface WorktreeStore {
  cwd: string;
  worktrees: WorktreeInfo[];
  isLoading: boolean;

  setCwd: (cwd: string) => void;
  refresh: () => Promise<void>;
  add: (path: string, branch: string, createBranch?: boolean) => Promise<WorktreeInfo>;
  remove: (path: string, force?: boolean) => Promise<void>;
  assignAgent: (worktreePath: string, agentId: string) => void;
  unassignAgent: (worktreePath: string) => void;
}

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  cwd: '',
  worktrees: [],
  isLoading: false,

  setCwd: (cwd) => set({ cwd }),

  refresh: async () => {
    const { cwd } = get();
    if (!cwd) return;
    set({ isLoading: true });
    try {
      const worktrees = await getApi().worktree.list(cwd);
      // Preserve agent assignments
      const existing = get().worktrees;
      const merged = worktrees.map((wt) => {
        const prev = existing.find((e) => e.path === wt.path);
        return prev?.assignedAgentId ? { ...wt, assignedAgentId: prev.assignedAgentId } : wt;
      });
      set({ worktrees: merged });
    } catch {
      // Not a git repo
    } finally {
      set({ isLoading: false });
    }
  },

  add: async (path, branch, createBranch) => {
    const { cwd } = get();
    const wt = await getApi().worktree.add({ cwd, path, branch, createBranch });
    await get().refresh();
    return wt;
  },

  remove: async (path, force) => {
    const { cwd } = get();
    await getApi().worktree.remove({ cwd, path, force });
    await get().refresh();
  },

  assignAgent: (worktreePath, agentId) => {
    set((state) => ({
      worktrees: state.worktrees.map((wt) =>
        wt.path === worktreePath ? { ...wt, assignedAgentId: agentId } : wt,
      ),
    }));
  },

  unassignAgent: (worktreePath) => {
    set((state) => ({
      worktrees: state.worktrees.map((wt) =>
        wt.path === worktreePath ? { ...wt, assignedAgentId: undefined } : wt,
      ),
    }));
  },
}));
