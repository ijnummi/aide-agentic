import { useEffect, useRef } from 'react';
import { useLayoutStore } from '../stores/layout.store';
import { useUIStore } from '../stores/ui.store';
import { useTerminalStore } from '../stores/terminal.store';
import { useTabSwitcherStore } from '../stores/tabswitcher.store';
import { getTerminalCache } from './useTerminal';
import { getSettings } from '../stores/settings.store';
import { useWorktreeStore } from '../stores/worktree.store';
import { useWorkspaceStore } from '../stores/workspace.store';
import { switchWorkspace, firstPane } from '../lib/workspace';
import { findTabByNumber, ALL_CHANGES_TAB_ID, RESERVED_NUMBER } from '../lib/tab-numbers';
import { useDocPreviewStore } from '../stores/docpreview.store';
import type { TabItem, PaneLeaf, LayoutTree, LayoutNode } from '../../shared/types/layout';

function findPaneById(node: LayoutTree, paneId: string): PaneLeaf | null {
  if (node.type === 'pane') return node.id === paneId ? node : null;
  for (const child of node.children) {
    const found = findPaneById(child, paneId);
    if (found) return found;
  }
  return null;
}

/** Get the last pane leaf in a subtree (rightmost/bottommost) */
function lastPane(node: LayoutTree): PaneLeaf | null {
  if (node.type === 'pane') return node;
  for (let i = node.children.length - 1; i >= 0; i--) {
    const found = lastPane(node.children[i]);
    if (found) return found;
  }
  return null;
}

type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * Find adjacent pane in the given direction.
 * left/right = sibling in horizontal split, up/down = sibling in vertical split.
 */
function findAdjacentPane(root: LayoutTree, paneId: string, direction: Direction): PaneLeaf | null {
  const isHorizontal = direction === 'left' || direction === 'right';
  const isForward = direction === 'right' || direction === 'down';

  function search(node: LayoutTree): PaneLeaf | null {
    if (node.type === 'pane') return null;

    const splitDir = node.direction;
    const matchAxis = (isHorizontal && splitDir === 'horizontal') || (!isHorizontal && splitDir === 'vertical');

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      // Check if this child contains the target pane
      if (findPaneById(child, paneId)) {
        if (matchAxis) {
          // The pane is in this split along the right axis — look at sibling
          const siblingIdx = isForward ? i + 1 : i - 1;
          if (siblingIdx >= 0 && siblingIdx < node.children.length) {
            // Return the nearest pane in the sibling subtree
            return isForward ? firstPane(node.children[siblingIdx]) : lastPane(node.children[siblingIdx]);
          }
        }
        // Recurse into the child that contains the pane
        return search(child);
      }
    }
    return null;
  }

  return search(root);
}

interface UseKeyboardOptions {
  cwd: string;
  onNewClaudeSession: () => void;
  onOpenAllChanges?: () => void;
}

export function useKeyboard({ cwd, onNewClaudeSession, onOpenAllChanges }: UseKeyboardOptions) {
  const addTab = useLayoutStore((s) => s.addTab);
  const splitPane = useLayoutStore((s) => s.splitPane);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const initialized = useLayoutStore((s) => s.initialized);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const tabSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabSwitchActiveRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!cwd || !initialized) return;

      // When focus is inside Monaco editor, only skip keys Monaco handles
      // (plain typing, Ctrl+S, Ctrl+Shift+V). Let app shortcuts through.
      if ((e.target as HTMLElement)?.closest?.('.monaco-editor')) {
        const isCtrlS = e.ctrlKey && !e.shiftKey && e.code === 'KeyS';
        const isCtrlShiftV = e.ctrlKey && e.shiftKey && e.code === 'KeyV';
        if (!e.altKey && !e.ctrlKey && !e.metaKey) return; // plain typing
        if (isCtrlS || isCtrlShiftV) return; // Monaco-handled shortcuts
      }

      // Ctrl+Tab / Ctrl+Shift+Tab — tab switching
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const switcher = useTabSwitcherStore.getState();
        const layoutState = useLayoutStore.getState();

        if (!tabSwitchActiveRef.current) {
          const pane = layoutState.root ? findPaneById(layoutState.root, layoutState.activePaneId) : null;
          if (!pane || pane.tabs.length < 2) return;

          tabSwitchActiveRef.current = true;
          switcher.open(pane.tabs, pane.activeTabId, pane.id, e.shiftKey);

          tabSwitchTimerRef.current = setTimeout(() => {
            useTabSwitcherStore.setState({ visible: true });
          }, getSettings().timing.tabSwitcherDelay);
        } else {
          if (e.shiftKey) {
            switcher.movePrev();
          } else {
            switcher.moveNext();
          }
        }
        return;
      }

      // Ctrl+Shift+Alt+Down — split down, Ctrl+Shift+Alt+Right — split right
      if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const dir = e.key === 'ArrowDown' ? 'vertical' : 'horizontal';
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: useTerminalStore.getState().getTitle(terminalId),
          metadata: { terminalId },
        };
        splitPane(activePaneId, dir as 'horizontal' | 'vertical', tab);
        return;
      }

      // Alt+Arrow — navigate between panes first, then tabs
      if (e.altKey && !e.ctrlKey && !e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const layoutState = useLayoutStore.getState();
        if (!layoutState.root) return;

        const direction: Direction =
          e.key === 'ArrowLeft' ? 'left' :
          e.key === 'ArrowRight' ? 'right' :
          e.key === 'ArrowUp' ? 'up' : 'down';

        // First: try to move to adjacent pane
        const adjacent = findAdjacentPane(layoutState.root, layoutState.activePaneId, direction);
        if (adjacent) {
          layoutState.setActivePane(adjacent.id);
          const activeTab = adjacent.tabs.find((t) => t.id === adjacent.activeTabId);
          if (activeTab?.type === 'terminal') {
            getTerminalCache().get(activeTab.id)?.term.focus();
          }
          return;
        }

        // Fallback for left/right: switch tabs in active pane
        if (direction === 'left' || direction === 'right') {
          const pane = findPaneById(layoutState.root, layoutState.activePaneId);
          if (pane && pane.tabs.length > 1) {
            const idx = pane.tabs.findIndex((t) => t.id === pane.activeTabId);
            const next = direction === 'right'
              ? (idx + 1) % pane.tabs.length
              : (idx - 1 + pane.tabs.length) % pane.tabs.length;
            const tab = pane.tabs[next];
            layoutState.setActiveTab(pane.id, tab.id);
            getTerminalCache().get(tab.id)?.term.focus();
          }
        }
        return;
      }

      // Alt+1-0 — focus tab by display number (4 = All Changes, reserved)
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const num = e.key === '0' ? 10 : parseInt(e.key, 10);
        const layoutState = useLayoutStore.getState();
        if (layoutState.root) {
          const pane = findPaneById(layoutState.root, layoutState.activePaneId);
          if (pane) {
            const tabId = findTabByNumber(pane.tabs, num);
            if (tabId) {
              layoutState.setActiveTab(pane.id, tabId);
              getTerminalCache().get(tabId)?.term.focus();
            } else if (num === RESERVED_NUMBER && onOpenAllChanges) {
              onOpenAllChanges();
            }
          }
        }
        return;
      }

      // Ctrl+B — toggle sidebar
      if (e.ctrlKey && !e.shiftKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+Shift+Left/Right — switch worktree
      if (e.ctrlKey && e.shiftKey && !e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const worktrees = useWorktreeStore.getState().worktrees;
        if (worktrees.length < 2) return;
        const currentPath = useWorkspaceStore.getState().projectPath;
        const idx = worktrees.findIndex((wt) => wt.path === currentPath);
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % worktrees.length
          : (idx - 1 + worktrees.length) % worktrees.length;
        switchWorkspace(worktrees[next].path);
        return;
      }



      // Ctrl+\ — split horizontal
      if (e.ctrlKey && !e.shiftKey && e.code === 'Backslash') {
        e.preventDefault();
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: useTerminalStore.getState().getTitle(terminalId),
          metadata: { terminalId },
        };
        splitPane(activePaneId, 'horizontal', tab);
        return;
      }

      // Ctrl+Shift+\ — split vertical
      if (e.ctrlKey && e.shiftKey && e.code === 'Backslash') {
        e.preventDefault();
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: useTerminalStore.getState().getTitle(terminalId),
          metadata: { terminalId },
        };
        splitPane(activePaneId, 'vertical', tab);
        return;
      }

      // Ctrl+T — new terminal tab
      if (e.ctrlKey && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: useTerminalStore.getState().getTitle(terminalId),
          metadata: { terminalId },
        };
        addTab(activePaneId, tab);
        return;
      }

      // Ctrl+Shift+C — new Claude session
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        onNewClaudeSession();
        return;
      }

      // Ctrl+Shift+V — toggle markdown preview (document tabs)
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        const layoutState = useLayoutStore.getState();
        if (layoutState.root) {
          const pane = findPaneById(layoutState.root, layoutState.activePaneId);
          const tab = pane?.tabs.find((t) => t.id === pane.activeTabId);
          if (tab?.type === 'document') {
            e.preventDefault();
            useDocPreviewStore.getState().toggle(`doc:${tab.metadata.relativePath}`);
          }
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' && tabSwitchActiveRef.current) {
        tabSwitchActiveRef.current = false;

        if (tabSwitchTimerRef.current) {
          clearTimeout(tabSwitchTimerRef.current);
          tabSwitchTimerRef.current = null;
        }

        const result = useTabSwitcherStore.getState().close();
        if (result) {
          setActiveTab(result.paneId, result.tab.id);
          if (result.tab.type === 'terminal') {
            getTerminalCache().get(result.tab.id)?.term.focus();
          }
        }
      }
    };

    // Use capture phase to intercept before xterm.js swallows the event
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [cwd, initialized, activePaneId, addTab, splitPane, setActiveTab, createTerminal, toggleSidebar, onNewClaudeSession]);
}
