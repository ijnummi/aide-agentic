import { create } from 'zustand';
import { getSettings } from './settings.store';

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
  sidebarWidth: getSettings().layout.sidebarDefaultWidth,
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
    const { sidebarMinWidth, sidebarMaxWidth } = getSettings().layout;
    set({ sidebarWidth: Math.max(sidebarMinWidth, Math.min(sidebarMaxWidth, width)) });
  },

  setTheme: (theme) => {
    set({ theme });
  },
}));
