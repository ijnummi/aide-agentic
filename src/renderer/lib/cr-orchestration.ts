import { useChangeRequestStore } from '../stores/change-request.store';
import { useWorktreeStore } from '../stores/worktree.store';
import { useWorkspaceStore } from '../stores/workspace.store';
import { useLayoutStore } from '../stores/layout.store';
import { switchWorkspace, cleanupWorktreeTerminals, firstPane } from './workspace';
import { disposeTerminal } from '../hooks/useTerminal';
import { useTerminalStore } from '../stores/terminal.store';
import { useClaudeStore } from '../stores/claude.store';
import { getApi } from './ipc';
import { getSettings } from '../stores/settings.store';

/**
 * Start a change request: create worktree, switch to it, send spec to primary Claude.
 */
export async function startCR(crId: string): Promise<void> {
  const crStore = useChangeRequestStore.getState();
  const result = await crStore.start(crId);
  const { worktreePath } = result;

  // Refresh worktree list so the new worktree appears
  await useWorktreeStore.getState().refresh();

  // Switch to the new worktree — this creates a fresh layout with primary Claude + terminal
  await switchWorkspace(worktreePath);

  // Read the spec to build the prompt
  const specResponse = await getApi().cr.readSpec({ cwd: crStore.cwd, crId });
  const specContent = specResponse.content;

  // Find the primary Claude session that bootstrapFresh/ensurePrimaryClaudeTab created
  const layoutStore = useLayoutStore.getState();
  if (!layoutStore.root) return;
  const pane = firstPane(layoutStore.root);
  if (!pane) return;
  const primaryTab = pane.tabs.find((t) => t.metadata?.isPrimary === true);
  if (!primaryTab) return;

  // Focus the Claude tab
  layoutStore.setActiveTab(pane.id, primaryTab.id);

  // The primary Claude session is lazy — the PTY gets created when ClaudePanel mounts.
  // Wait for it to be ready, then send the spec as the first message.
  const sessionId = primaryTab.id;
  const prompt = buildPrompt(specContent);

  // Wait for the Claude PTY to initialize, then send the prompt
  waitForPty(sessionId, () => {
    getApi().pty.write({ id: sessionId, data: prompt + '\n' });
  });
}

function buildPrompt(specContent: string): string {
  return [
    'Read the following change request specification and implement it.',
    'Work through it step by step. Read CLAUDE.md for project conventions.',
    '',
    specContent,
  ].join('\n');
}

/**
 * Wait for a PTY to exist in the terminal store, then call the callback.
 * ClaudePanel lazily creates the PTY on mount, so we poll briefly.
 */
function waitForPty(sessionId: string, callback: () => void, attempts = 0) {
  if (attempts > 20) return; // give up after ~10s
  const terminal = useTerminalStore.getState().terminals.get(sessionId);
  if (terminal) {
    // PTY exists — wait a bit more for Claude CLI to fully initialize
    setTimeout(callback, 2000);
  } else {
    setTimeout(() => waitForPty(sessionId, callback, attempts + 1), 500);
  }
}

/**
 * Stop a running change request: kill Claude PTY, update status.
 */
export async function stopCR(crId: string): Promise<void> {
  const crStore = useChangeRequestStore.getState();
  const cr = crStore.items.find((c) => c.id === crId);

  // Kill all terminals in the CR worktree
  if (cr?.worktreePath) {
    cleanupWorktreeTerminals(cr.worktreePath);
  }

  await crStore.stop(crId);
}

/**
 * Discard a change request: switch to main, cleanup, delete worktree + branch.
 */
export async function discardCR(crId: string): Promise<void> {
  const crStore = useChangeRequestStore.getState();
  const cr = crStore.items.find((c) => c.id === crId);

  if (cr?.worktreePath) {
    const currentPath = useWorkspaceStore.getState().projectPath;
    const mainPath = useWorktreeStore.getState().worktrees.find((w) => w.isMain)?.path;
    // Switch to main if currently in the CR worktree
    if (mainPath && currentPath === cr.worktreePath) {
      await switchWorkspace(mainPath);
    }
    cleanupWorktreeTerminals(cr.worktreePath);
  }

  await crStore.discard(crId);
  await useWorktreeStore.getState().refresh();
}

/**
 * Approve a change request: switch to main, cleanup, merge or create PR.
 */
export async function approveCR(crId: string, strategy: 'merge' | 'pr'): Promise<void> {
  const crStore = useChangeRequestStore.getState();
  const cr = crStore.items.find((c) => c.id === crId);

  if (cr?.worktreePath) {
    const currentPath = useWorkspaceStore.getState().projectPath;
    const mainPath = useWorktreeStore.getState().worktrees.find((w) => w.isMain)?.path;
    if (mainPath && currentPath === cr.worktreePath) {
      await switchWorkspace(mainPath);
    }
    cleanupWorktreeTerminals(cr.worktreePath);
  }

  await crStore.approve(crId, strategy);
  await useWorktreeStore.getState().refresh();
}
