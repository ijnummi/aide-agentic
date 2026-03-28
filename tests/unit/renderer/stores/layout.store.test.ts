import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TabItem, PaneLeaf } from '../../../../src/shared/types/layout';

let counter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${++counter}`,
});

import { useLayoutStore, findPane } from '../../../../src/renderer/stores/layout.store';

function tab(id: string, type: TabItem['type'] = 'terminal'): TabItem {
  return { id, type, title: id };
}

function resetStore() {
  useLayoutStore.setState({ root: null, activePaneId: '', initialized: false });
  counter = 0;
}

describe('layout store', () => {
  beforeEach(resetStore);

  describe('initializeWithTerminal', () => {
    it('creates a single pane with one terminal tab', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const { root, activePaneId, initialized } = useLayoutStore.getState();
      expect(initialized).toBe(true);
      expect(root).not.toBeNull();
      expect(root!.type).toBe('pane');
      const pane = root as PaneLeaf;
      expect(pane.tabs).toHaveLength(1);
      expect(pane.tabs[0].id).toBe('t1');
      expect(pane.activeTabId).toBe('t1');
      expect(activePaneId).toBe(pane.id);
    });

    it('does not re-initialize', () => {
      const store = useLayoutStore.getState();
      store.initializeWithTerminal('t1');
      const firstRoot = useLayoutStore.getState().root;
      store.initializeWithTerminal('t2');
      expect(useLayoutStore.getState().root).toBe(firstRoot);
    });
  });

  describe('addTab', () => {
    it('adds a tab to the pane', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(2);
      expect(pane.activeTabId).toBe('t2');
    });

    it('does not duplicate — focuses existing tab instead', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      useLayoutStore.getState().addTab(paneId, tab('t1'));
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(2);
      expect(pane.activeTabId).toBe('t1');
    });
  });

  describe('removeTab', () => {
    it('removes a tab and activates the last remaining', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      useLayoutStore.getState().removeTab(paneId, 't2');
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(1);
      expect(pane.activeTabId).toBe('t1');
    });

    it('keeps empty root pane when last tab is removed', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().removeTab(paneId, 't1');
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(0);
      expect(pane.activeTabId).toBe('');
    });
  });

  describe('setActiveTab', () => {
    it('changes active tab', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      useLayoutStore.getState().setActiveTab(paneId, 't1');
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.activeTabId).toBe('t1');
    });
  });

  describe('splitPane', () => {
    it('replaces pane with a split containing original and new pane', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().splitPane(paneId, 'horizontal', tab('t2'));
      const root = useLayoutStore.getState().root!;
      expect(root.type).toBe('split');
      if (root.type === 'split') {
        expect(root.direction).toBe('horizontal');
        expect(root.children).toHaveLength(2);
        expect(root.sizes).toEqual([50, 50]);
        const left = root.children[0] as PaneLeaf;
        const right = root.children[1] as PaneLeaf;
        expect(left.tabs[0].id).toBe('t1');
        expect(right.tabs[0].id).toBe('t2');
      }
    });
  });

  describe('closePane', () => {
    it('removes a pane from a split, collapsing to single pane', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().splitPane(paneId, 'horizontal', tab('t2'));
      const root = useLayoutStore.getState().root!;
      if (root.type === 'split') {
        const rightPane = root.children[1] as PaneLeaf;
        useLayoutStore.getState().closePane(rightPane.id);
        const newRoot = useLayoutStore.getState().root!;
        expect(newRoot.type).toBe('pane');
        expect((newRoot as PaneLeaf).tabs[0].id).toBe('t1');
      }
    });
  });

  describe('removeTabById', () => {
    it('removes tab from whichever pane contains it', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      useLayoutStore.getState().removeTabById('t2');
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(1);
      expect(pane.tabs[0].id).toBe('t1');
    });
  });

  describe('focusOrAddTab', () => {
    it('focuses existing tab if found', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t2'));
      useLayoutStore.getState().setActiveTab(paneId, 't1');
      useLayoutStore.getState().focusOrAddTab(paneId, tab('t2'));
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.activeTabId).toBe('t2');
      expect(pane.tabs).toHaveLength(2);
    });

    it('adds new tab if not found', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().focusOrAddTab(paneId, tab('t3'));
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(2);
    });
  });

  describe('insertTabAt', () => {
    it('inserts tab at specific index', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().addTab(paneId, tab('t3'));
      useLayoutStore.getState().insertTabAt(paneId, tab('t2'), 1);
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
    });

    it('does not duplicate — focuses existing tab', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().insertTabAt(paneId, tab('t1'), 0);
      const pane = useLayoutStore.getState().root as PaneLeaf;
      expect(pane.tabs).toHaveLength(1);
      expect(pane.activeTabId).toBe('t1');
    });
  });

  describe('updateSplitSizes', () => {
    it('updates sizes of a split node', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const paneId = useLayoutStore.getState().activePaneId;
      useLayoutStore.getState().splitPane(paneId, 'horizontal', tab('t2'));
      const root = useLayoutStore.getState().root!;
      if (root.type === 'split') {
        useLayoutStore.getState().updateSplitSizes(root.id, [30, 70]);
        const updated = useLayoutStore.getState().root!;
        if (updated.type === 'split') {
          expect(updated.sizes).toEqual([30, 70]);
        }
      }
    });
  });

  describe('findPane', () => {
    it('finds a pane by id', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const root = useLayoutStore.getState().root!;
      const paneId = useLayoutStore.getState().activePaneId;
      const found = findPane(root, paneId);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(paneId);
    });

    it('returns null for non-existent id', () => {
      useLayoutStore.getState().initializeWithTerminal('t1');
      const root = useLayoutStore.getState().root!;
      expect(findPane(root, 'nope')).toBeNull();
    });
  });
});
