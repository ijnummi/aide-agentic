import { useEffect, useState, useCallback, useRef } from 'react';
import { SplitContainer } from './SplitContainer';
import { StatusBar } from './StatusBar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { useLayoutStore } from '../../stores/layout.store';
import { useTerminalStore } from '../../stores/terminal.store';
import { useUIStore } from '../../stores/ui.store';
import { useClaude } from '../../hooks/useClaude';
import { useGit } from '../../hooks/useGit';
import { useWorktree } from '../../hooks/useWorktree';
import { getApi } from '../../lib/ipc';
import type { TabItem } from '../../../shared/types/layout';

export function AppShell() {
  const root = useLayoutStore((s) => s.root);
  const initialized = useLayoutStore((s) => s.initialized);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const initializeWithTerminal = useLayoutStore((s) => s.initializeWithTerminal);
  const splitPane = useLayoutStore((s) => s.splitPane);
  const addTab = useLayoutStore((s) => s.addTab);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const { startSession } = useClaude();
  const [cwd, setCwd] = useState<string>('');
  const bootstrapRef = useRef(false);
  useGit(cwd);
  useWorktree(cwd);

  useEffect(() => {
    getApi()
      .shell.info()
      .then((info) => setCwd(info.cwd));
  }, []);

  // Bootstrap: create the first terminal and initialize layout
  useEffect(() => {
    if (!cwd || bootstrapRef.current) return;
    bootstrapRef.current = true;
    createTerminal(cwd).then((terminalId) => {
      initializeWithTerminal(terminalId);
    });
  }, [cwd, createTerminal, initializeWithTerminal]);

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (!cwd || !initialized) return;

      // Ctrl+\ — split horizontal
      if (e.ctrlKey && !e.shiftKey && e.code === 'Backslash') {
        e.preventDefault();
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: 'Terminal',
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
          title: 'Terminal',
          metadata: { terminalId },
        };
        splitPane(activePaneId, 'vertical', tab);
        return;
      }

      // Ctrl+T — new terminal tab in active pane
      if (e.ctrlKey && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        const terminalId = await createTerminal(cwd);
        const tab: TabItem = {
          id: terminalId,
          type: 'terminal',
          title: 'Terminal',
          metadata: { terminalId },
        };
        addTab(activePaneId, tab);
        return;
      }

      // Ctrl+Shift+C — new Claude Code session tab
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const sessionId = startSession(cwd);
        const tab: TabItem = {
          id: sessionId,
          type: 'claude',
          title: 'Claude',
          metadata: { sessionId },
        };
        addTab(activePaneId, tab);
        return;
      }
    },
    [cwd, initialized, activePaneId, splitPane, addTab, createTerminal, startSession],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!cwd || !root) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        {sidebarVisible && <Sidebar />}
        <div className="flex-1 overflow-hidden">
          <SplitContainer node={root} cwd={cwd} />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
