# AIDE — Project Conventions

## Overview
AIDE (AI Development Environment) is an Electron desktop app for managing AI terminals, code reviews, and git worktrees. It provides a VS Code-style tab/split layout with deep Claude Code integration.

## Tech Stack
- **Runtime**: Electron + Node.js
- **Build**: Electron Forge + Vite
- **Frontend**: React 19 + TypeScript (strict mode)
- **State**: Zustand 5 with immer middleware
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
- Unit tests alongside source in `tests/unit/`
- E2E tests in `tests/e2e/`
- Run: `pnpm test` (unit), `pnpm test:e2e` (Playwright)

## Common Commands
```bash
pnpm dev          # Start Electron in dev mode with HMR
pnpm build        # Production build
pnpm make         # Package for distribution
pnpm test         # Run unit tests (Vitest)
pnpm test:e2e     # Run E2E tests (Playwright)
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Key Technical Notes
- xterm.js package is `@xterm/xterm` (not old `xterm`)
- node-pty must be externalized in `vite.main.config.ts`
- Claude Code CLI: use `--output-format stream-json --verbose --include-partial-messages`
- Git: use `--porcelain=v2` for machine-readable status output
- Git worktrees: use `--porcelain` for machine-readable worktree list
