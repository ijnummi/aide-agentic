import { create } from 'zustand';
import type { DocFileEntry, DocsReadResponse } from '../../shared/types/docs';
import { getApi } from '../lib/ipc';

interface DocsStore {
  cwd: string;
  files: DocFileEntry[];
  isLoading: boolean;

  setCwd: (cwd: string) => void;
  refresh: () => Promise<void>;
  readFile: (filePath: string) => Promise<DocsReadResponse>;
}

export const useDocsStore = create<DocsStore>((set, get) => ({
  cwd: '',
  files: [],
  isLoading: false,

  setCwd: (cwd) => set({ cwd }),

  refresh: async () => {
    const { cwd } = get();
    if (!cwd) return;
    set({ isLoading: true });
    try {
      const response = await getApi().docs.discover({ cwd });
      set({ files: response.files });
    } catch {
      set({ files: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  readFile: async (filePath: string) => {
    return getApi().docs.readFile({ filePath });
  },
}));
