import { create } from 'zustand';

interface DocPreviewStore {
  /** Map of tab ID → preview mode on/off */
  previews: Map<string, boolean>;
  get: (tabId: string) => boolean;
  set: (tabId: string, preview: boolean) => void;
  toggle: (tabId: string) => void;
}

export const useDocPreviewStore = create<DocPreviewStore>((set, getState) => ({
  previews: new Map(),

  get: (tabId) => getState().previews.get(tabId) ?? false,

  set: (tabId, preview) => {
    set((state) => {
      const previews = new Map(state.previews);
      previews.set(tabId, preview);
      return { previews };
    });
  },

  toggle: (tabId) => {
    set((state) => {
      const previews = new Map(state.previews);
      previews.set(tabId, !previews.get(tabId));
      return { previews };
    });
  },
}));
