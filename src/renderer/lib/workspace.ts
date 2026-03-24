import { getApi } from './ipc';
import { PRIMARY_CLAUDE_TITLE } from './names';
import { useWorkspaceStore } from '../stores/workspace.store';
import { useLayoutStore } from '../stores/layout.store';
import { useTerminalStore } from '../stores/terminal.store';
import { useClaudeStore } from '../stores/claude.store';
import { writeTerminalScrollback } from '../hooks/useTerminal';
import type { LayoutTree, PaneLeaf, TabItem } from '../../shared/types/layout';

interface LayoutSnapshot {
  root: LayoutTree;
  activePaneId: string;
}

/** In-memory layout cache per worktree path (survives switches, not app restarts) */
const layoutCache = new Map<string, LayoutSnapshot>();

/** Find the first pane leaf in a layout tree */
function firstPane(node: LayoutTree): PaneLeaf | null {
  if (node.type === 'pane') return node;
  for (const child of node.children) {
    const found = firstPane(child);
    if (found) return found;
  }
  return null;
}

/** Ensure the first pane has a primary Claude tab at index 0 */
export function ensurePrimaryClaudeTab(cwd: string) {
  const layoutStore = useLayoutStore.getState();
  if (!layoutStore.root) return;

  const pane = firstPane(layoutStore.root);
  if (!pane) return;

  // Already has a primary Claude tab at position 0
  if (pane.tabs[0]?.metadata?.isPrimary === true) return;

  // Check if a primary Claude tab exists elsewhere in this pane
  const existing = pane.tabs.find((t) => t.metadata?.isPrimary === true);
  if (existing) return; // exists but not at 0 — leave it (user reordered)

  // Create a new primary Claude session and insert at index 0
  const claudeStore = useClaudeStore.getState();
  const sessionId = claudeStore.createSession(cwd);
  const claudeTab: TabItem = {
    id: sessionId,
    type: 'claude',
    title: PRIMARY_CLAUDE_TITLE,
    metadata: { sessionId, isPrimary: true },
  };
  layoutStore.insertTabAt(pane.id, claudeTab, 0);
}

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

  // Ensure primary Claude tab exists after restoring old sessions
  ensurePrimaryClaudeTab(path);

  return true;
}

export async function bootstrapFresh(cwd: string) {
  const claudeStore = useClaudeStore.getState();
  const terminalStore = useTerminalStore.getState();
  const layoutStore = useLayoutStore.getState();

  // Primary Claude session (lazy — no CLI process until first message)
  const sessionId = claudeStore.createSession(cwd);
  const claudeTab: TabItem = {
    id: sessionId,
    type: 'claude',
    title: PRIMARY_CLAUDE_TITLE,
    metadata: { sessionId, isPrimary: true },
  };

  // Terminal
  const terminalId = await terminalStore.createTerminal(cwd);
  const terminalTab: TabItem = {
    id: terminalId,
    type: 'terminal',
    title: terminalStore.getTitle(terminalId),
    metadata: { terminalId },
  };

  layoutStore.restoreLayout({
    id: crypto.randomUUID(),
    type: 'pane',
    activeTabId: terminalTab.id, // Start in terminal, not idle Claude
    tabs: [claudeTab, terminalTab],
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

  // 3. Restore: in-memory cache → disk → fresh bootstrap
  const cached = layoutCache.get(newPath);
  if (cached) {
    layoutStore.restoreLayout(cached.root);
    layoutStore.setActivePane(cached.activePaneId);
  } else if (!(await restoreFromDisk(newPath))) {
    await bootstrapFresh(newPath);
  }
}
