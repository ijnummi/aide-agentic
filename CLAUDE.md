# AIDE — Project Conventions

## Overview
AIDE (AI Development Environment) is an Electron desktop app for managing AI terminals, code reviews, and git worktrees. It provides a VS Code-style tab/split layout with deep Claude Code integration.

## Tech Stack
- **Runtime**: Electron + Node.js
- **Build**: Electron Forge + Vite
- **Frontend**: React 19 + TypeScript (strict mode)
- **State**: Zustand 5
- **Styling**: Tailwind CSS 4 (utility-first, no CSS-in-JS)
- **Terminal**: @xterm/xterm + node-pty
- **Layout**: allotment (split panes)
- **Git**: git CLI via child_process + @octokit/rest
- **Persistence**: electron-store
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package manager**: pnpm

## Architecture Rules

### Process Separation
- **Main process** (`src/main/`): Node.js services, IPC handlers, native modules (node-pty)
- **Renderer process** (`src/renderer/`): React SPA, Zustand stores, UI components
- **Preload** (`src/main/preload.ts`): contextBridge exposing `window.aide` API
- **Shared** (`src/shared/`): Types and constants used by both processes

### Security
- `contextIsolation: true`, `nodeIntegration: false` — always
- Never import Node.js modules in renderer code
- All main-process access goes through `window.aide.*` (contextBridge)
- Validate IPC message payloads in handlers

### IPC Patterns
- Renderer → Main: `ipcRenderer.invoke` (request/response) via preload bridge
- Main → Renderer: `webContents.send` (push events for streams like pty:data, claude:event)
- Channel names defined in `src/shared/constants.ts`
- Payload types defined in `src/shared/types/ipc.ts`

### File Naming
- Services: `*.service.ts` (main process classes)
- IPC handlers: `*.ipc.ts` (register handlers for a domain)
- Stores: `*.store.ts` (Zustand stores)
- Hooks: `use*.ts` (React hooks)
- Components: `PascalCase.tsx`
- Types: `*.ts` in `src/shared/types/`

### Component Patterns
- Functional components only
- Hooks for all side effects and IPC communication
- Zustand stores for shared state (no prop drilling)
- Lazy-mount xterm.js terminals (never `display:none`, use `visibility:hidden` or unmount)

### Testing
- Unit tests in `tests/unit/` mirroring `src/` structure
- E2E tests in `tests/e2e/` using Playwright Electron API
- Shared IPC mock at `tests/unit/renderer/stores/helpers/mock-api.ts` — use `installMockApi()` for store tests that call `getApi()`
- Vitest config: two projects — `main` (node env) and `renderer` (jsdom env) with path aliases
- E2E config: global setup builds main+preload for tests, starts Vite renderer dev server
- E2E fixtures create a temp git repo per test and launch a fresh Electron instance
- Add `data-*` attributes to components for e2e test targeting (e.g. `data-panel` on ActivityBar)

## Common Commands
```bash
pnpm dev            # Start Electron in dev mode with HMR
pnpm build          # Production build
pnpm make           # Package for distribution
pnpm test           # Run unit tests (Vitest)
pnpm test:watch     # Run unit tests in watch mode
pnpm test:coverage  # Run unit tests with coverage (text + HTML + JSON)
pnpm test:ci        # Run unit tests with coverage + JUnit XML report
pnpm test:e2e       # Run E2E tests (Playwright + Electron)
pnpm lint           # ESLint
pnpm format         # Prettier
```

## Key Technical Notes
- xterm.js package is `@xterm/xterm` (not old `xterm`)
- node-pty must be externalized in `vite.main.config.ts`
- Claude Code CLI: use `--output-format stream-json --verbose --include-partial-messages`
- Git: use `--porcelain=v2` for machine-readable status output
- Git worktrees: use `--porcelain` for machine-readable worktree list
- Git log: uses `--shortstat` with custom separator for parsing files changed/additions/deletions
- All configurable values live in `src/shared/settings.ts` (`DEFAULT_SETTINGS`) — never hardcode
- Coverage provider: `@vitest/coverage-v8`; reports to `coverage/` (gitignored)
- E2E build output: `.vite/build-e2e/` (gitignored under `.vite/`)
- E2E Vite configs in `tests/e2e/vite.e2e-{main,preload}.config.ts` mirror forge plugin settings (`resolve.conditions: ['node']`, Node builtins externalized)
