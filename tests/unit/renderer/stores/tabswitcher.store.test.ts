import { describe, it, expect, beforeEach } from 'vitest';
import { useTabSwitcherStore } from '../../../../src/renderer/stores/tabswitcher.store';
import type { TabItem } from '../../../../src/shared/types/layout';

function tab(id: string): TabItem {
  return { id, type: 'terminal', title: id, metadata: {} };
}

const tabs = [tab('a'), tab('b'), tab('c')];

function resetStore() {
  useTabSwitcherStore.setState({ visible: false, tabs: [], selectedIndex: 0, paneId: '' });
}

describe('tabswitcher store', () => {
  beforeEach(resetStore);

  describe('open', () => {
    it('sets tabs and selects next tab', () => {
      useTabSwitcherStore.getState().open(tabs, 'a', 'pane-1', false);
      const state = useTabSwitcherStore.getState();
      expect(state.tabs).toEqual(tabs);
      expect(state.selectedIndex).toBe(1); // next after 'a'
      expect(state.paneId).toBe('pane-1');
    });

    it('wraps around forward from last tab', () => {
      useTabSwitcherStore.getState().open(tabs, 'c', 'pane-1', false);
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(0);
    });

    it('selects previous tab when reverse', () => {
      useTabSwitcherStore.getState().open(tabs, 'b', 'pane-1', true);
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(0);
    });

    it('wraps around backward from first tab', () => {
      useTabSwitcherStore.getState().open(tabs, 'a', 'pane-1', true);
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(2);
    });
  });

  describe('moveNext / movePrev', () => {
    it('moveNext increments with wraparound', () => {
      useTabSwitcherStore.getState().open(tabs, 'a', 'p', false);
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(1);
      useTabSwitcherStore.getState().moveNext();
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(2);
      useTabSwitcherStore.getState().moveNext();
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(0);
    });

    it('movePrev decrements with wraparound', () => {
      useTabSwitcherStore.getState().open(tabs, 'b', 'p', false);
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(2);
      useTabSwitcherStore.getState().movePrev();
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(1);
      useTabSwitcherStore.getState().movePrev();
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(0);
      useTabSwitcherStore.getState().movePrev();
      expect(useTabSwitcherStore.getState().selectedIndex).toBe(2);
    });
  });

  describe('close', () => {
    it('returns selected tab and pane, then clears state', () => {
      useTabSwitcherStore.getState().open(tabs, 'a', 'pane-1', false);
      const result = useTabSwitcherStore.getState().close();
      expect(result).toEqual({ tab: tab('b'), paneId: 'pane-1' });
      expect(useTabSwitcherStore.getState().tabs).toEqual([]);
    });

    it('returns null when no tabs', () => {
      const result = useTabSwitcherStore.getState().close();
      expect(result).toBeNull();
    });
  });

  describe('cancel', () => {
    it('clears state without returning selection', () => {
      useTabSwitcherStore.getState().open(tabs, 'a', 'pane-1', false);
      useTabSwitcherStore.getState().cancel();
      const state = useTabSwitcherStore.getState();
      expect(state.tabs).toEqual([]);
      expect(state.selectedIndex).toBe(0);
      expect(state.paneId).toBe('');
    });
  });
});
