import { useEffect, useRef } from 'react';
import { useLayoutStore } from '../stores/layout.store';
import { useUIStore } from '../stores/ui.store';
import { useTerminalStore } from '../stores/terminal.store';
import { useTabSwitcherStore } from '../stores/tabswitcher.store';
import { usePersistence } from './usePersistence';
import { getTerminalCache } from './useTerminal';
import { getSettings } from '../stores/settings.store';
import type { TabItem, PaneLeaf, LayoutTree } from '../../shared/types/layout';

function findPaneById(node: LayoutTree, paneId: string): PaneLeaf | null {
  if (node.type === 'pane') return node.id === paneId ? node : null;
  for (const child of node.children) {
    const found = findPaneById(child, paneId);
    if (found) return found;
  }
  return null;
}

interface UseKeyboardOptions {
  cwd: string;
  onNewClaudeSession: () => void;
}

export function useKeyboard({ cwd, onNewClaudeSession }: UseKeyboardOptions) {
  const addTab = useLayoutStore((s) => s.addTab);
  const splitPane = useLayoutStore((s) => s.splitPane);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const initialized = useLayoutStore((s) => s.initialized);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { save } = usePersistence();

  const tabSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabSwitchActiveRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!cwd || !initialized) return;

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

      // Ctrl+B — toggle sidebar
      if (e.ctrlKey && !e.shiftKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+S — save session
      if (e.ctrlKey && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        await save();
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
  }, [cwd, initialized, activePaneId, addTab, splitPane, setActiveTab, createTerminal, toggleSidebar, save, onNewClaudeSession]);
}
