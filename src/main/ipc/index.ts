import type { BrowserWindow } from 'electron';
import { registerPtyHandlers } from './pty.ipc';
import { registerClaudeHandlers } from './claude.ipc';
import { registerGitHandlers } from './git.ipc';
import { registerWorktreeHandlers } from './worktree.ipc';
import { registerGitHubHandlers } from './github.ipc';
import { registerPersistenceHandlers } from './persistence.ipc';
import { registerDocsHandlers } from './docs.ipc';
import { registerChangeRequestHandlers } from './change-request.ipc';
import type { PtyService } from '../services/pty.service';
import type { ClaudeService } from '../services/claude.service';
import type { GitService } from '../services/git.service';
import type { WorktreeService } from '../services/worktree.service';
import type { GitHubService } from '../services/github.service';
import type { PersistenceService } from '../services/persistence.service';
import type { DocsService } from '../services/docs.service';
import type { ChangeRequestService } from '../services/change-request.service';

export function registerAllHandlers(
  ptyService: PtyService,
  claudeService: ClaudeService,
  gitService: GitService,
  worktreeService: WorktreeService,
  githubService: GitHubService,
  persistenceService: PersistenceService,
  docsService: DocsService,
  crService: ChangeRequestService,
  getWindow: () => BrowserWindow | null,
) {
  registerPtyHandlers(ptyService, getWindow);
  registerClaudeHandlers(claudeService, getWindow);
  registerGitHandlers(gitService);
  registerWorktreeHandlers(worktreeService);
  registerGitHubHandlers(githubService);
  registerPersistenceHandlers(persistenceService);
  registerDocsHandlers(docsService);
  registerChangeRequestHandlers(crService);
}
