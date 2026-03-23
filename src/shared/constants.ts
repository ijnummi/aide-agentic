export const IPC = {
  // PTY
  PTY_CREATE: 'pty:create',
  PTY_WRITE: 'pty:write',
  PTY_RESIZE: 'pty:resize',
  PTY_KILL: 'pty:kill',
  PTY_DATA: 'pty:data',
  PTY_EXIT: 'pty:exit',

  // Claude Code
  CLAUDE_START: 'claude:start',
  CLAUDE_SEND: 'claude:send',
  CLAUDE_STOP: 'claude:stop',
  CLAUDE_EVENT: 'claude:event',
  CLAUDE_STATUS: 'claude:status',

  // Git
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',
  GIT_LOG: 'git:log',
  GIT_STAGE: 'git:stage',
  GIT_COMMIT: 'git:commit',
  GIT_BRANCHES: 'git:branches',
  GIT_CHECKOUT: 'git:checkout',

  // GitHub
  GITHUB_AUTH: 'github:auth',
  GITHUB_PRS: 'github:prs',
  GITHUB_PR_DETAIL: 'github:pr-detail',
  GITHUB_PR_DIFF: 'github:pr-diff',
  GITHUB_PR_COMMENTS: 'github:pr-comments',
  GITHUB_PR_REVIEW: 'github:pr-review',
  GITHUB_PR_COMMENT: 'github:pr-comment',

  // Worktree
  WORKTREE_LIST: 'worktree:list',
  WORKTREE_ADD: 'worktree:add',
  WORKTREE_REMOVE: 'worktree:remove',
  WORKTREE_PRUNE: 'worktree:prune',

  // Persistence
  SESSION_SAVE: 'session:save',
  SESSION_LOAD: 'session:load',
  SESSION_LIST: 'session:list',

  // Shell
  SHELL_INFO: 'shell:info',
  OPEN_EXTERNAL: 'shell:open-external',
} as const;
