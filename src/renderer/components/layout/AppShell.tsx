import { useEffect, useCallback, useRef } from 'react';
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
import { usePersistence } from '../../hooks/usePersistence';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { registerTerminalExitListener } from '../../hooks/useTerminal';
import { getApi } from '../../lib/ipc';
import { claudeName } from '../../lib/names';
import { ensurePrimaryClaudeTab, bootstrapFresh } from '../../lib/workspace';
import type { TabItem } from '../../../shared/types/layout';

export function AppShell() {
  const root = useLayoutStore((s) => s.root);
  const addTab = useLayoutStore((s) => s.addTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const { startSession } = useClaude();
  const removeTabById = useLayoutStore((s) => s.removeTabById);

  // Auto-close terminal tabs when PTY exits
  useEffect(() => {
    registerTerminalExitListener((terminalId) => {
      useTerminalStore.getState().removeTerminal(terminalId);
      useLayoutStore.getState().removeTabById(terminalId);
    });
  }, []);
  const { restore } = usePersistence();
  const cwd = useWorkspaceStore((s) => s.projectPath);
  const setProjectPath = useWorkspaceStore((s) => s.setProjectPath);
  const bootstrapRef = useRef(false);
  useGit(cwd);
  useWorktree(cwd);

  const handleNewClaudeSession = useCallback(() => {
    if (!cwd) return;
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: claudeName(),
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  }, [cwd, startSession, addTab, activePaneId]);

  useKeyboard({ cwd, onNewClaudeSession: handleNewClaudeSession });

  useEffect(() => {
    getApi()
      .shell.info()
      .then((info) => setProjectPath(info.cwd));
  }, [setProjectPath]);

  // Bootstrap: try to restore session, else create [Claude, Terminal]
  useEffect(() => {
    if (!cwd || bootstrapRef.current) return;
    bootstrapRef.current = true;

    restore(cwd).then((restored) => {
      if (restored) {
        ensurePrimaryClaudeTab(cwd);
      } else {
        bootstrapFresh(cwd);
      }
    });
  }, [cwd, restore]);

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
