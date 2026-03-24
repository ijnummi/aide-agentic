import { getApi } from './ipc';
import { useWorkspaceStore } from '../stores/workspace.store';
import { useLayoutStore } from '../stores/layout.store';
import { useTerminalStore } from '../stores/terminal.store';
import { useClaudeStore } from '../stores/claude.store';
import { writeTerminalScrollback } from '../hooks/useTerminal';
import type { LayoutTree, TabItem } from '../../shared/types/layout';

interface LayoutSnapshot {
  root: LayoutTree;
  activePaneId: string;
}

/** In-memory layout cache per worktree path (survives switches, not app restarts) */
const layoutCache = new Map<string, LayoutSnapshot>();

async function restoreFromDisk(path: string): Promise<boolean> {
  const saved = await getApi().session.load(path);
  if (!saved?.layout) return false;

  const claudeStore = useClaudeStore.getState();
  const terminalStore = useTerminalStore.getState();
  const layoutStore = useLayoutStore.getState();

  // Restore Claude sessions (skip if already alive)
  for (const cs of saved.claudeSessions) {
    if (claudeStore.sessions.has(cs.id)) continue;
    const id = claudeStore.createSession(cs.cwd, cs.worktreeId, cs.id);
    if (cs.claudeSessionId) claudeStore.setClaudeSessionId(id, cs.claudeSessionId);
    for (const msg of cs.messages) claudeStore.addMessage(id, msg);
    if (cs.cost !== undefined) claudeStore.setCost(id, cs.cost);
    claudeStore.updateSessionStatus(id, 'waiting');
  }

  // Restore terminals (skip if already alive)
  for (const pt of saved.terminals) {
    if (terminalStore.terminals.has(pt.id)) continue;
    await terminalStore.createTerminal(pt.cwd, pt.shell, pt.id);
    if (pt.scrollback) {
      setTimeout(() => writeTerminalScrollback(pt.id, pt.scrollback), 500);
    }
  }

  layoutStore.restoreLayout(saved.layout);
  if (saved.activePaneId) layoutStore.setActivePane(saved.activePaneId);
  return true;
}

async function bootstrapFresh(cwd: string) {
  const terminalStore = useTerminalStore.getState();
  const layoutStore = useLayoutStore.getState();

  const terminalId = await terminalStore.createTerminal(cwd);
  const tab: TabItem = {
    id: terminalId,
    type: 'terminal',
    title: terminalStore.getTitle(terminalId),
    metadata: { terminalId },
  };
  layoutStore.restoreLayout({
    id: crypto.randomUUID(),
    type: 'pane',
    activeTabId: tab.id,
    tabs: [tab],
  });
}

/**
 * Switch the workspace to a different directory (e.g. a worktree).
 * Caches the current layout, then restores (or creates) the target's layout.
 * Terminals and sessions stay alive in their stores — only the visible layout swaps.
 */
export async function switchWorkspace(newPath: string) {
  const current = useWorkspaceStore.getState().projectPath;
  if (newPath === current) return;

  const layoutStore = useLayoutStore.getState();

  // 1. Cache current layout in memory
  if (current && layoutStore.root) {
    layoutCache.set(current, {
      root: layoutStore.root,
      activePaneId: layoutStore.activePaneId,
    });
  }

  // 2. Switch path
  useWorkspaceStore.getState().setProjectPath(newPath);

  // 3. Restore: in-memory cache → disk → fresh terminal
  const cached = layoutCache.get(newPath);
  if (cached) {
    layoutStore.restoreLayout(cached.root);
    layoutStore.setActivePane(cached.activePaneId);
  } else if (!(await restoreFromDisk(newPath))) {
    await bootstrapFresh(newPath);
  }
}
