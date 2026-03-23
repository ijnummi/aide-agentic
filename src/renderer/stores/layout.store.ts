import { create } from 'zustand';
import type { LayoutTree, LayoutNode, PaneLeaf, TabItem } from '../../shared/types/layout';

interface LayoutStore {
  root: LayoutTree | null;
  activePaneId: string;
  initialized: boolean;

  initializeWithTerminal: (terminalId: string) => void;
  addTab: (paneId: string, tab: TabItem) => void;
  removeTab: (paneId: string, tabId: string) => void;
  setActiveTab: (paneId: string, tabId: string) => void;
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical', newTab: TabItem) => void;
  closePane: (paneId: string) => void;
  updateSplitSizes: (splitId: string, sizes: number[]) => void;
  setActivePane: (paneId: string) => void;
  restoreLayout: (layout: LayoutTree) => void;
}

function createPane(tab: TabItem): PaneLeaf {
  return {
    id: crypto.randomUUID(),
    type: 'pane',
    activeTabId: tab.id,
    tabs: [tab],
  };
}

function updateNode(node: LayoutTree, paneId: string, updater: (pane: PaneLeaf) => LayoutTree | null): LayoutTree | null {
  if (node.type === 'pane') {
    if (node.id === paneId) {
      return updater(node);
    }
    return node;
  }

  const newChildren: (LayoutNode | PaneLeaf)[] = [];
  let changed = false;

  for (const child of node.children) {
    const result = updateNode(child, paneId, updater);
    if (result === null) {
      changed = true;
      continue;
    }
    if (result !== child) {
      changed = true;
    }
    newChildren.push(result as LayoutNode | PaneLeaf);
  }

  if (!changed) return node;

  if (newChildren.length === 0) return null;
  if (newChildren.length === 1) return newChildren[0];

  return { ...node, children: newChildren };
}

function findPane(node: LayoutTree, paneId: string): PaneLeaf | null {
  if (node.type === 'pane') {
    return node.id === paneId ? node : null;
  }
  for (const child of node.children) {
    const found = findPane(child, paneId);
    if (found) return found;
  }
  return null;
}

function replacePaneWithSplit(
  node: LayoutTree,
  paneId: string,
  direction: 'horizontal' | 'vertical',
  newTab: TabItem,
): LayoutTree {
  if (node.type === 'pane') {
    if (node.id === paneId) {
      const newPane = createPane(newTab);
      const split: LayoutNode = {
        id: crypto.randomUUID(),
        type: 'split',
        direction,
        sizes: [50, 50],
        children: [node, newPane],
      };
      return split;
    }
    return node;
  }

  return {
    ...node,
    children: node.children.map((child) =>
      replacePaneWithSplit(child, paneId, direction, newTab) as LayoutNode | PaneLeaf,
    ),
  };
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  root: null,
  activePaneId: '',
  initialized: false,

  initializeWithTerminal: (terminalId: string) => {
    if (get().initialized) return;
    const tab: TabItem = {
      id: terminalId,
      type: 'terminal',
      title: 'Terminal 1',
      metadata: { terminalId },
    };
    const pane = createPane(tab);
    set({ root: pane, activePaneId: pane.id, initialized: true });
  },

  addTab: (paneId, tab) => {
    set((state) => {
      if (!state.root) return state;
      const root = updateNode(state.root, paneId, (pane) => ({
        ...pane,
        tabs: [...pane.tabs, tab],
        activeTabId: tab.id,
      }));
      return { root: root || state.root };
    });
  },

  removeTab: (paneId, tabId) => {
    set((state) => {
      if (!state.root) return state;
      const root = updateNode(state.root, paneId, (pane) => {
        const tabs = pane.tabs.filter((t) => t.id !== tabId);
        if (tabs.length === 0) return null;
        const activeTabId = pane.activeTabId === tabId ? tabs[tabs.length - 1].id : pane.activeTabId;
        return { ...pane, tabs, activeTabId };
      });
      return { root: root || state.root };
    });
  },

  setActiveTab: (paneId, tabId) => {
    set((state) => {
      if (!state.root) return state;
      const root = updateNode(state.root, paneId, (pane) => ({
        ...pane,
        activeTabId: tabId,
      }));
      return { root: root || state.root };
    });
  },

  splitPane: (paneId, direction, newTab) => {
    set((state) => {
      if (!state.root) return state;
      return { root: replacePaneWithSplit(state.root, paneId, direction, newTab) };
    });
  },

  closePane: (paneId) => {
    set((state) => {
      if (!state.root) return state;
      const root = updateNode(state.root, paneId, () => null);
      return { root: root || state.root };
    });
  },

  updateSplitSizes: (splitId, sizes) => {
    set((state) => {
      if (!state.root) return state;
      const update = (node: LayoutTree): LayoutTree => {
        if (node.type === 'split') {
          if (node.id === splitId) {
            return { ...node, sizes };
          }
          return {
            ...node,
            children: node.children.map((c) => update(c) as LayoutNode | PaneLeaf),
          };
        }
        return node;
      };
      return { root: update(state.root) };
    });
  },

  setActivePane: (paneId) => {
    set({ activePaneId: paneId });
  },

  restoreLayout: (layout) => {
    set({ root: layout });
  },
}));

export { findPane };
