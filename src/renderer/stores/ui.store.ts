import { create } from 'zustand';

export type SidebarPanel = 'terminals' | 'claude-sessions' | 'git' | 'worktrees' | 'github';

interface UIStore {
  sidebarVisible: boolean;
  sidebarWidth: number;
  activeSidebarPanel: SidebarPanel;
  theme: 'dark' | 'light';

  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarVisible: false,
  sidebarWidth: 250,
  activeSidebarPanel: 'terminals',
  theme: 'dark',

  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  setSidebarPanel: (panel) => {
    const state = get();
    if (state.activeSidebarPanel === panel && state.sidebarVisible) {
      set({ sidebarVisible: false });
    } else {
      set({ activeSidebarPanel: panel, sidebarVisible: true });
    }
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(150, Math.min(500, width)) });
  },

  setTheme: (theme) => {
    set({ theme });
  },
}));
