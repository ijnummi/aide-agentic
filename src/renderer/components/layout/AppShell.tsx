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
import { usePersistence } from '../../hooks/usePersistence';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { getApi } from '../../lib/ipc';
import type { TabItem } from '../../../shared/types/layout';

export function AppShell() {
  const root = useLayoutStore((s) => s.root);
  const initializeWithTerminal = useLayoutStore((s) => s.initializeWithTerminal);
  const addTab = useLayoutStore((s) => s.addTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const { startSession } = useClaude();
  const { restore } = usePersistence();
  const setProjectPath = useWorkspaceStore((s) => s.setProjectPath);
  const [cwd, setCwd] = useState<string>('');
  const bootstrapRef = useRef(false);
  useGit(cwd);
  useWorktree(cwd);

  const handleNewClaudeSession = useCallback(() => {
    if (!cwd) return;
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: 'Claude',
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  }, [cwd, startSession, addTab, activePaneId]);

  useKeyboard({ cwd, onNewClaudeSession: handleNewClaudeSession });

  useEffect(() => {
    getApi()
      .shell.info()
      .then((info) => setCwd(info.cwd));
  }, []);

  // Bootstrap: try to restore session, else create first terminal
  useEffect(() => {
    if (!cwd || bootstrapRef.current) return;
    bootstrapRef.current = true;
    setProjectPath(cwd);

    restore(cwd).then((restored) => {
      if (!restored) {
        createTerminal(cwd).then((terminalId) => {
          initializeWithTerminal(terminalId);
        });
      }
    });
  }, [cwd, createTerminal, initializeWithTerminal, restore, setProjectPath]);

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
