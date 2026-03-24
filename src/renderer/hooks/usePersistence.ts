import { useEffect, useRef, useCallback } from 'react';
import { getApi } from '../lib/ipc';
import { useLayoutStore } from '../stores/layout.store';
import { useTerminalStore } from '../stores/terminal.store';
import { useClaudeStore } from '../stores/claude.store';
import { useUIStore } from '../stores/ui.store';
import { useWorkspaceStore } from '../stores/workspace.store';
import { getTerminalScrollback, writeTerminalScrollback } from './useTerminal';
import { getSettings } from '../stores/settings.store';
import type { SessionState } from '../../shared/types/persistence';

export function usePersistence() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  const collectState = useCallback((): SessionState | null => {
    const workspace = useWorkspaceStore.getState();
    if (!workspace.projectPath) return null;

    const layout = useLayoutStore.getState();
    if (!layout.initialized) return null;

    const terminalStore = useTerminalStore.getState();
    const claudeStore = useClaudeStore.getState();
    const ui = useUIStore.getState();
    const terminals = Array.from(terminalStore.terminals.values()).map((t) => ({
      id: t.id,
      cwd: t.cwd,
      shell: t.shell,
      title: t.title,
      scrollback: getTerminalScrollback(t.id),
    }));

    const claudeSessions = Array.from(claudeStore.sessions.values()).map((s) => ({
      id: s.id,
      claudeSessionId: s.claudeSessionId,
      cwd: s.cwd,
      worktreeId: s.worktreeId,
      messages: s.messages,
      status: s.status === 'running' ? 'stopped' as const : s.status,
      cost: s.cost,
    }));

    return {
      version: 1,
      projectPath: workspace.projectPath,
      savedAt: Date.now(),
      layout: layout.root,
      activePaneId: layout.activePaneId,
      terminals,
      claudeSessions,
      ui: {
        sidebarVisible: ui.sidebarVisible,
        sidebarWidth: ui.sidebarWidth,
        activeSidebarPanel: ui.activeSidebarPanel,
        theme: ui.theme,
      },
      worktreeAssignments: {},
    };
  }, []);

  const save = useCallback(async () => {
    const state = collectState();
    if (state) {
      await getApi().session.save(state);
    }
  }, [collectState]);

  const restore = useCallback(async (projectPath: string): Promise<boolean> => {
    if (restoredRef.current) return false;
    restoredRef.current = true;

    let state: SessionState | null = null;
    try {
      state = await getApi().session.load(projectPath);
    } catch {
      return false;
    }

    // Only restore if we have a valid layout with content
    if (!state || !state.layout) return false;

    // Restore UI state
    const uiStore = useUIStore.getState();
    if (state.ui) {
      if (state.ui.sidebarVisible) uiStore.toggleSidebar();
      uiStore.setSidebarWidth(state.ui.sidebarWidth || 250);
      if (state.ui.theme) uiStore.setTheme(state.ui.theme as 'dark' | 'light');
    }

    // Restore Claude session history (read-only, sessions start as waiting)
    const claudeStore = useClaudeStore.getState();
    for (const cs of state.claudeSessions) {
      const id = claudeStore.createSession(cs.cwd, cs.worktreeId, cs.id);
      if (cs.claudeSessionId) {
        claudeStore.setClaudeSessionId(id, cs.claudeSessionId);
      }
      if (cs.messages.length > 0) {
        for (const msg of cs.messages) {
          claudeStore.addMessage(id, msg);
        }
      }
      if (cs.cost !== undefined) {
        claudeStore.setCost(id, cs.cost);
      }
      claudeStore.updateSessionStatus(id, 'waiting');
    }

    // Restore terminals — create PTYs with the same IDs so layout tabs match
    const terminalStore = useTerminalStore.getState();
    for (const pt of state.terminals) {
      await terminalStore.createTerminal(pt.cwd, pt.shell, pt.id);
      if (pt.scrollback) {
        setTimeout(() => writeTerminalScrollback(pt.id, pt.scrollback), 500);
      }
    }

    // Restore layout
    const layoutStore = useLayoutStore.getState();
    layoutStore.restoreLayout(state.layout);
    if (state.activePaneId) {
      layoutStore.setActivePane(state.activePaneId);
    }

    return true;
  }, []);

  // Auto-save on interval
  useEffect(() => {
    intervalRef.current = setInterval(save, getSettings().timing.autoSaveInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [save]);

  // Save on beforeunload
  useEffect(() => {
    const handler = () => { save(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [save]);

  return { save, restore };
}
