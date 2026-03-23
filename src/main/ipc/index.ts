import type { BrowserWindow } from 'electron';
import { registerPtyHandlers } from './pty.ipc';
import { registerClaudeHandlers } from './claude.ipc';
import { registerGitHandlers } from './git.ipc';
import { registerWorktreeHandlers } from './worktree.ipc';
import { registerGitHubHandlers } from './github.ipc';
import type { PtyService } from '../services/pty.service';
import type { ClaudeService } from '../services/claude.service';
import type { GitService } from '../services/git.service';
import type { WorktreeService } from '../services/worktree.service';
import type { GitHubService } from '../services/github.service';

export function registerAllHandlers(
  ptyService: PtyService,
  claudeService: ClaudeService,
  gitService: GitService,
  worktreeService: WorktreeService,
  githubService: GitHubService,
  getWindow: () => BrowserWindow | null,
) {
  registerPtyHandlers(ptyService, getWindow);
  registerClaudeHandlers(claudeService, getWindow);
  registerGitHandlers(gitService);
  registerWorktreeHandlers(worktreeService);
  registerGitHubHandlers(githubService);
}
