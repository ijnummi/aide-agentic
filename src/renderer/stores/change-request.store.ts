import { create } from 'zustand';
import type {
  ChangeRequest,
  CRType,
  CRCreateResponse,
  CRStartResponse,
  CRApproveResponse,
} from '../../shared/types/change-request';
import { getApi } from '../lib/ipc';

export type CRFilter = 'active' | 'approved' | 'discarded' | 'all';

interface ChangeRequestStore {
  cwd: string;
  items: ChangeRequest[];
  isLoading: boolean;
  filter: CRFilter;

  setCwd: (cwd: string) => void;
  setFilter: (filter: CRFilter) => void;
  refresh: () => Promise<void>;
  create: (type: CRType, name: string, description: string) => Promise<CRCreateResponse>;
  start: (crId: string) => Promise<CRStartResponse>;
  stop: (crId: string) => Promise<void>;
  approve: (crId: string, strategy: 'merge' | 'pr') => Promise<CRApproveResponse>;
  discard: (crId: string) => Promise<void>;
}

export const useChangeRequestStore = create<ChangeRequestStore>((set, get) => ({
  cwd: '',
  items: [],
  isLoading: false,
  filter: 'active',

  setCwd: (cwd) => set({ cwd }),

  setFilter: (filter) => set({ filter }),

  refresh: async () => {
    const { cwd } = get();
    if (!cwd) return;
    set({ isLoading: true });
    try {
      const response = await getApi().cr.list({ cwd });
      set({ items: response.items });
    } catch {
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (type, name, description) => {
    const { cwd } = get();
    const result = await getApi().cr.create({ cwd, type, name, description });
    await get().refresh();
    return result;
  },

  start: async (crId) => {
    const { cwd } = get();
    const result = await getApi().cr.start({ cwd, crId });
    await get().refresh();
    return result;
  },

  stop: async (crId) => {
    const { cwd } = get();
    await getApi().cr.stop({ cwd, crId });
    await get().refresh();
  },

  approve: async (crId, strategy) => {
    const { cwd } = get();
    const result = await getApi().cr.approve({ cwd, crId, strategy });
    await get().refresh();
    return result;
  },

  discard: async (crId) => {
    const { cwd } = get();
    await getApi().cr.discard({ cwd, crId });
    await get().refresh();
  },
}));
