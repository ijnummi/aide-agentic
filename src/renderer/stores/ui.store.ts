import { create } from 'zustand';
import { getSettings } from './settings.store';

export type SidebarPanel = 'home' | 'terminals' | 'claude-sessions' | 'git' | 'worktrees' | 'github';

interface UIStore {
  sidebarVisible: boolean;
  sidebarWidth: number;
  activeSidebarPanel: SidebarPanel;
  theme: 'dark' | 'light';
  zoomLevel: number;
  /** File currently visible at the scroll position in the All Changes diff viewer */
  visibleDiffFile: string;

  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarVisible: true,
  sidebarWidth: getSettings().layout.sidebarDefaultWidth,
  activeSidebarPanel: 'home',
  theme: 'dark',
  zoomLevel: 100,
  visibleDiffFile: '',

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

  zoomIn: () => {
    const next = Math.min(get().zoomLevel + 10, 200);
    set({ zoomLevel: next });
    document.documentElement.style.zoom = `${next}%`;
  },

  zoomOut: () => {
    const next = Math.max(get().zoomLevel - 10, 50);
    set({ zoomLevel: next });
    document.documentElement.style.zoom = `${next}%`;
  },

  resetZoom: () => {
    set({ zoomLevel: 100 });
    document.documentElement.style.zoom = '100%';
  },
}));
