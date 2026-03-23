# AIDE — Task Checklist

## Phase 0 — Project Setup
- [x] Create `TODO.md` in project root
- [x] Create `CLAUDE.md` with project conventions

## Phase 1 — Foundation (terminal in a window)
- [x] 1. Scaffold Electron Forge + Vite + React + TypeScript project with `pnpm`
- [x] 2. Configure Tailwind CSS 4 + PostCSS
- [x] 3. Configure TypeScript (root + main + renderer tsconfigs)
- [x] 4. Configure ESLint + Prettier
- [x] 5. Implement `src/main/main.ts` — app entry, BrowserWindow creation
- [x] 6. Implement `src/main/preload.ts` — contextBridge with `window.aide` API
- [x] 7. Implement `src/shared/constants.ts` — IPC channel name constants
- [x] 8. Implement `src/shared/types/ipc.ts` — IPC payload types
- [x] 9. Implement `src/shared/types/terminal.ts` — terminal instance types
- [x] 10. Implement `src/main/util/shell.ts` — detect user shell
- [x] 11. Implement `src/main/util/platform.ts` — OS-specific paths
- [x] 12. Implement `src/main/services/pty.service.ts` — node-pty process management
- [x] 13. Implement `src/main/ipc/pty.ipc.ts` — PTY IPC handlers
- [x] 14. Implement `src/main/ipc/index.ts` — register all IPC handlers
- [x] 15. Implement `src/renderer/styles/globals.css` — Tailwind directives + base
- [x] 16. Implement `src/renderer/styles/xterm.css` — xterm theme overrides
- [x] 17. Implement `src/renderer/lib/ipc.ts` — typed IPC wrappers
- [x] 18. Implement `src/renderer/hooks/useTerminal.ts` — xterm.js lifecycle + IPC
- [x] 19. Implement `src/renderer/components/terminal/TerminalPanel.tsx` — xterm.js wrapper
- [x] 20. Implement `src/renderer/stores/terminal.store.ts` — terminal instances state
- [x] 21. Implement `src/renderer/components/layout/AppShell.tsx` — top-level grid
- [x] 22. Implement `src/renderer/App.tsx` — root component
- [x] 23. Implement `src/renderer/index.tsx` — React DOM mount
- [ ] 24. Verify: `pnpm dev` launches window with working terminal

## Phase 2 — Layout system (tabs & splits)
- [x] 25. Implement `src/shared/types/layout.ts` — LayoutNode, PaneLeaf, TabItem types
- [x] 26. Implement `src/renderer/stores/layout.store.ts` — recursive split tree in Zustand
- [x] 27. Implement `src/renderer/stores/ui.store.ts` — sidebar, theme, modals
- [x] 28. Implement `src/renderer/styles/allotment.css` — allotment overrides
- [x] 29. Implement `src/renderer/components/layout/TabBar.tsx` — tab strip
- [x] 30. ~~Implement `src/renderer/components/layout/Tab.tsx`~~ — tab rendering inline in TabBar
- [x] 31. Implement `src/renderer/components/layout/SplitContainer.tsx` — recursive Allotment
- [x] 32. Implement `src/renderer/components/layout/PaneContainer.tsx` — wraps content in pane
- [x] 33. Implement `src/renderer/components/layout/StatusBar.tsx` — bottom status bar
- [x] 34. Implement `src/renderer/components/layout/ActivityBar.tsx` — icon rail
- [x] 35. Implement `src/renderer/components/layout/Sidebar.tsx` — collapsible panel
- [x] 36. ~~Implement `src/renderer/components/terminal/TerminalTabs.tsx`~~ — handled by TabBar
- [x] 37. Implement `src/renderer/components/terminal/TerminalToolbar.tsx` — terminal actions
- [x] 38. Implement shared UI components: `IconButton` (others added as needed)
- [x] 39. Wire up: new terminal tab (Ctrl+T), close tab, split h/v (Ctrl+\, Ctrl+Shift+\)
- [ ] 40. Verify: tabs and splits work, terminals are independent

## Phase 3 — Claude Code integration
- [x] 41. Implement `src/shared/types/claude.ts` — session, message, tool-call types
- [x] 42. Implement `src/main/services/claude.service.ts` — spawn CLI + parse stream-json
- [x] 43. Implement `src/main/ipc/claude.ipc.ts` — Claude Code IPC handlers
- [x] 44. Update `src/main/preload.ts` — add claude API to contextBridge
- [x] 45. Implement `src/renderer/stores/claude.store.ts` — sessions, messages, tool-call blocks
- [x] 46. Implement `src/renderer/lib/claude-message-parser.ts` — stream events → store actions
- [x] 47. Implement `src/renderer/hooks/useClaude.ts` — Claude session management hook
- [x] 48. Implement `src/renderer/components/claude/ClaudePanel.tsx` — session container
- [x] 49. Implement `src/renderer/components/claude/ClaudeChat.tsx` — message list
- [x] 50. Implement `src/renderer/components/claude/ClaudeInput.tsx` — prompt input
- [x] 51. Implement `src/renderer/components/claude/ToolCallCard.tsx` — structured tool call display
- [ ] 52. Implement `src/renderer/components/claude/ApprovalBanner.tsx` — approve/reject banner (deferred: uses Claude Code's own terminal approval for MVP)
- [x] 53. Implement `src/renderer/components/claude/AgentStatusBadge.tsx` — agent state indicator
- [x] 54. Implement `src/renderer/components/claude/SessionList.tsx` — session list in sidebar
- [x] 55. Wire up "New Claude Code Session" (Ctrl+Shift+C) + tab type + sidebar
- [x] 56. Implement raw terminal ↔ structured view toggle (Chat/Terminal buttons in ClaudePanel)
- [ ] 57. Verify: Claude Code session starts, structured output renders, toggle works

## Phase 4 — Git integration
- [x] 58. Implement `src/shared/types/git.ts` — status, branch, diff, log types
- [x] 59. Implement `src/main/services/git.service.ts` — git CLI wrapper
- [x] 60. Implement `src/main/ipc/git.ipc.ts` — git IPC handlers
- [x] 61. Update `src/main/preload.ts` — add git API to contextBridge
- [x] 62. Implement `src/renderer/stores/git.store.ts` — branch, status, changes
- [x] 63. Implement `src/renderer/hooks/useGit.ts` — git status polling (5s interval)
- [x] 64. Implement `src/renderer/lib/diff-parser.ts` — unified diff → structured data
- [x] 65. Implement `src/renderer/components/git/GitStatus.tsx` — branch + changed files + staging
- [x] 66. Implement `src/renderer/components/git/BranchSelector.tsx` — branch picker dropdown
- [x] 67. Implement `src/renderer/components/git/CommitPanel.tsx` — commit message + button
- [x] 68. Implement `src/renderer/components/review/DiffViewer.tsx` — inline diff with line numbers
- [x] 69. ~~Implement `src/renderer/components/review/DiffLine.tsx`~~ — inline in DiffViewer
- [x] 70. ~~Implement `src/renderer/components/review/FileTree.tsx`~~ — file list in GitStatus
- [ ] 71. Verify: git status shows in sidebar, diffs render correctly

## Phase 5 — Worktree management
- [x] 72. Implement `src/shared/types/worktree.ts` — worktree types
- [x] 73. Implement `src/main/services/worktree.service.ts` — git worktree CRUD
- [x] 74. Implement `src/main/ipc/worktree.ipc.ts` — worktree IPC handlers
- [x] 75. Update `src/main/preload.ts` — add worktree API to contextBridge
- [x] 76. Implement `src/renderer/stores/worktree.store.ts` — worktree list + agent assignments
- [x] 77. Implement `src/renderer/hooks/useWorktree.ts` — worktree operations
- [x] 78. Implement `src/renderer/components/worktree/WorktreeList.tsx` — list all worktrees
- [x] 79. Implement `src/renderer/components/worktree/WorktreeCard.tsx` — worktree + assigned agent
- [x] 80. Implement `src/renderer/components/worktree/CreateWorktreeDialog.tsx` — add worktree
- [x] 81. Implement `src/renderer/components/worktree/WorktreeSelector.tsx` — dropdown switcher
- [x] 82. Wire up worktree-agent assignment (one Claude session per worktree)
- [ ] 83. Verify: create/list/delete worktrees, assign agents

## Phase 6 — GitHub integration
- [x] 84. Implement `src/shared/types/github.ts` — PR, review, comment types
- [x] 85. Implement `src/main/services/github.service.ts` — @octokit/rest wrapper
- [x] 86. Implement `src/main/ipc/github.ipc.ts` — GitHub IPC handlers
- [x] 87. Update `src/main/preload.ts` — add github API to contextBridge
- [x] 88. Implement `src/renderer/stores/github.store.ts` — PRs, reviews
- [x] 89. ~~Implement `src/renderer/hooks/useGitHub.ts`~~ — store handles directly
- [x] 90. Implement `src/renderer/components/review/PRList.tsx` — PR listing + auth
- [x] 91. Implement `src/renderer/components/review/PRDetail.tsx` — PR view + diff + comments
- [x] 92. Implement `src/renderer/components/review/ReviewComment.tsx` — PR comment
- [x] 93. Implement `src/renderer/components/review/ReviewActions.tsx` — approve/request changes/comment
- [ ] 94. ~~Implement `src/renderer/components/review/AgentChangesReview.tsx`~~ — deferred to later
- [ ] 95. Verify: list PRs, view diff, submit review

## Phase 7 — Persistence
- [x] 96. Implement `src/shared/types/persistence.ts` — SessionState schema
- [x] 97. Implement `src/main/services/persistence.service.ts` — electron-store
- [x] 98. Implement `src/main/ipc/persistence.ipc.ts` — session save/load IPC
- [x] 99. Update `src/main/preload.ts` — add session API to contextBridge
- [x] 100. Implement `src/renderer/stores/workspace.store.ts` — project path, settings
- [x] 101. Implement `src/renderer/hooks/usePersistence.ts` — auto-save + restore
- [x] 102. Add `@xterm/addon-serialize` — terminal scrollback serialization
- [x] 103. Implement restore-on-launch flow (layout + scrollback + Claude history)
- [ ] 104. ~~Implement `src/main/services/window.service.ts`~~ — deferred (single window for now)
- [ ] 105. Verify: close and reopen app, verify full state restoration

## Phase 8 — Polish
- [x] 106. Implement `src/renderer/hooks/useKeyboard.ts` — global keyboard shortcuts (Ctrl+B, Ctrl+S, Ctrl+T, Ctrl+\, Ctrl+Shift+\, Ctrl+Shift+C)
- [x] 107. Implement command palette (Ctrl+Shift+P) — fuzzy search, arrow keys, enter to execute
- [x] 108. Dark/light theme toggle (Catppuccin Mocha/Latte) — via command palette or store
- [x] 109. Error handling + toast notifications (success/error/info with auto-dismiss)
- [ ] 110. ~~Implement `src/renderer/components/shared/ContextMenu.tsx`~~ — deferred

## Phase 9 — Testing
- [ ] 111. Configure `vitest.config.ts`
- [ ] 112. Configure `playwright.config.ts`
- [ ] 113. Write unit tests for services (pty, git, claude, worktree, persistence)
- [ ] 114. Write unit tests for stores (layout, terminal, claude, git)
- [ ] 115. Write unit tests for `diff-parser.ts` and `claude-message-parser.ts`
- [ ] 116. Write Playwright E2E tests (app launch, terminal, splits, Claude session)
- [ ] 117. Verify: `pnpm test` and `pnpm test:e2e` pass
