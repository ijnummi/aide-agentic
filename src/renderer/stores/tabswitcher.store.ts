import { create } from 'zustand';
import type { TabItem } from '../../shared/types/layout';

interface TabSwitcherStore {
  visible: boolean;
  tabs: TabItem[];
  selectedIndex: number;
  paneId: string;

  open: (tabs: TabItem[], currentTabId: string, paneId: string, reverse: boolean) => void;
  moveNext: () => void;
  movePrev: () => void;
  close: () => { tab: TabItem; paneId: string } | null;
  cancel: () => void;
}

export const useTabSwitcherStore = create<TabSwitcherStore>((set, get) => ({
  visible: false,
  tabs: [],
  selectedIndex: 0,
  paneId: '',

  open: (tabs, currentTabId, paneId, reverse) => {
    const currentIndex = tabs.findIndex((t) => t.id === currentTabId);
    let nextIndex: number;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
    }
    set({ tabs, selectedIndex: nextIndex, paneId, visible: false });
  },

  moveNext: () => {
    set((s) => ({
      selectedIndex: s.selectedIndex >= s.tabs.length - 1 ? 0 : s.selectedIndex + 1,
    }));
  },

  movePrev: () => {
    set((s) => ({
      selectedIndex: s.selectedIndex <= 0 ? s.tabs.length - 1 : s.selectedIndex - 1,
    }));
  },

  close: () => {
    const { tabs, selectedIndex, paneId } = get();
    const tab = tabs[selectedIndex];
    set({ visible: false, tabs: [], selectedIndex: 0, paneId: '' });
    return tab ? { tab, paneId } : null;
  },

  cancel: () => {
    set({ visible: false, tabs: [], selectedIndex: 0, paneId: '' });
  },
}));
