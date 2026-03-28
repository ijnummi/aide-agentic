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
  CLAUDE_WATCH: 'claude:watch',
  CLAUDE_UNWATCH: 'claude:unwatch',
  CLAUDE_STATS: 'claude:stats',

  // Git
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',
  GIT_LOG: 'git:log',
  GIT_STAGE: 'git:stage',
  GIT_COMMIT: 'git:commit',
  GIT_BRANCHES: 'git:branches',
  GIT_CHECKOUT: 'git:checkout',
  GIT_REVERT_ALL: 'git:revert-all',
  GIT_SHOW: 'git:show',

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

  // Docs
  DOCS_DISCOVER: 'docs:discover',
  DOCS_READ: 'docs:read',
  DOCS_WRITE: 'docs:write',

  // Change Requests
  CR_LIST: 'cr:list',
  CR_GET: 'cr:get',
  CR_CREATE: 'cr:create',
  CR_READ_SPEC: 'cr:read-spec',
  CR_WRITE_SPEC: 'cr:write-spec',
  CR_START: 'cr:start',
  CR_STOP: 'cr:stop',
  CR_APPROVE: 'cr:approve',
  CR_DISCARD: 'cr:discard',
  CR_DELETE_ALL: 'cr:delete-all',
  CR_DEBUG_RESET: 'cr:debug-reset',

  // Shell
  SHELL_INFO: 'shell:info',
  OPEN_EXTERNAL: 'shell:open-external',
} as const;
