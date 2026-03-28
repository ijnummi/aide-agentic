# AIDE

AI Development Environment — a desktop app for managing AI terminals, code reviews, and git worktrees with deep Claude Code integration.

## Features

- **Terminal management** — Multiple PTY-based terminals with VS Code-style tab/split layout
- **Claude Code integration** — Claude sessions as first-class tabs with token tracking and session stats
- **Git worktrees** — Create, switch, and delete worktrees; per-worktree terminal/session isolation
- **Git commit log** — Recent commits in sidebar with stats; click to view commit diff
- **Code review** — GitHub PR browsing, inline diff viewer with character-level highlighting
- **Definitions panel** — Browse and edit project skills, CLAUDE.md, README, and other documentation
- **Monaco editor** — Full VS Code editor for file editing with markdown preview (Ctrl+Shift+V)
- **Keyboard-driven** — Tab/pane navigation, quick switcher, command palette

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron + Node.js |
| Build | Electron Forge + Vite |
| Frontend | React 19 + TypeScript (strict) |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Terminal | @xterm/xterm + node-pty |
| Editor | Monaco Editor |
| Layout | allotment (split panes) |
| Git | git CLI + @octokit/rest |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start in dev mode with HMR
pnpm dev

# Clean build artifacts and restart
pnpm clean && pnpm dev
```

## Commands

```bash
pnpm dev            # Start Electron in dev mode with HMR
pnpm clean          # Remove Vite cache and build output
pnpm build          # Production build
pnpm make           # Package for distribution
pnpm test           # Run unit tests (Vitest)
pnpm test:watch     # Run unit tests in watch mode
pnpm test:coverage  # Run unit tests with coverage report
pnpm test:ci        # Run unit tests with coverage + JUnit XML
pnpm test:e2e       # Run E2E tests (Playwright)
pnpm lint           # ESLint
pnpm format         # Prettier
```

## Testing

### Unit Tests (Vitest)

165 tests across 21 files covering pure functions, Zustand stores, and main-process services.

```bash
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report (text + HTML + JSON)
```

Test structure mirrors `src/`:

```
tests/unit/
  main/
    services/       # GitService, ChangeRequestService
    util/           # shell, platform
  renderer/
    lib/            # diff-parser, inline-diff, claude-message-parser, etc.
    stores/         # All Zustand stores (layout, claude, git, terminal, ui, etc.)
      helpers/      # Shared mock-api for window.aide IPC mocking
```

Coverage reporters: `text` (terminal), `html` (browse at `coverage/index.html`), `json-summary`. CI mode adds JUnit XML at `reports/junit.xml`.

### E2E Tests (Playwright + Electron)

5 tests exercising the git sidebar feature end-to-end against a real Electron window.

```bash
pnpm test:e2e          # Run (builds main+preload, starts Vite dev server, launches Electron)
```

The test infrastructure:
- **Global setup** builds the main process with a test Vite dev server URL baked in, starts the renderer dev server, and tears it down after
- **Fixtures** create a temp git repo with known commits and launch a fresh Electron instance per test
- Tests interact with the real app UI via Playwright selectors

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+T | New terminal |
| Ctrl+Shift+C | New Claude session |
| Ctrl+B | Toggle sidebar |
| Ctrl+P | Quick switcher |
| Ctrl+Shift+P | Command palette |
| Alt+1..0 | Focus tab by number |
| Alt+Arrow | Navigate panes/tabs |
| Ctrl+\\ | Split right |
| Ctrl+Shift+\\ | Split down |
| Ctrl+Shift+Left/Right | Switch worktree |
| Ctrl+Shift+V | Toggle markdown preview (in editor) |
| ? | Keyboard shortcuts overlay |

## Architecture

```
src/
  main/           # Electron main process
    services/     # Node.js services (pty, git, docs, etc.)
    ipc/          # IPC handler registration
    preload.ts    # contextBridge (window.aide API)
  renderer/       # React SPA
    components/   # UI components
    stores/       # Zustand stores
    hooks/        # React hooks
    lib/          # Utilities
  shared/         # Types and constants (both processes)
    types/
    constants.ts
    settings.ts
```

All main-process access goes through `window.aide.*` via the preload bridge. Context isolation is always enabled; Node.js modules are never imported in renderer code.

## License

MIT
