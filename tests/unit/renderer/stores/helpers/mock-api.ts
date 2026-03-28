import { vi } from 'vitest';
import type { AideAPI } from '../../../../../src/renderer/lib/ipc';

const noop = () => () => {};

export function createMockApi(): { [K in keyof AideAPI]: { [M in keyof AideAPI[K]]: ReturnType<typeof vi.fn> } } {
  return {
    pty: {
      create: vi.fn().mockResolvedValue({ id: 'pty-1', pid: 1234 }),
      write: vi.fn().mockResolvedValue(undefined),
      resize: vi.fn().mockResolvedValue(undefined),
      kill: vi.fn().mockResolvedValue(undefined),
      onData: vi.fn().mockImplementation(noop),
      onExit: vi.fn().mockImplementation(noop),
    },
    claude: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      onEvent: vi.fn().mockImplementation(noop),
      onStatus: vi.fn().mockImplementation(noop),
      watch: vi.fn().mockResolvedValue(undefined),
      unwatch: vi.fn().mockResolvedValue(undefined),
      onStats: vi.fn().mockImplementation(noop),
    },
    git: {
      status: vi.fn().mockResolvedValue({ branch: 'main', upstream: '', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] }),
      diff: vi.fn().mockResolvedValue(''),
      log: vi.fn().mockResolvedValue([]),
      stage: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
      branches: vi.fn().mockResolvedValue([]),
      checkout: vi.fn().mockResolvedValue(undefined),
      revertAll: vi.fn().mockResolvedValue(undefined),
      show: vi.fn().mockResolvedValue(''),
    },
    worktree: {
      list: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue({ path: '/tmp/wt', branch: 'feat', isMain: false }),
      remove: vi.fn().mockResolvedValue(undefined),
      prune: vi.fn().mockResolvedValue(undefined),
    },
    github: {
      authenticate: vi.fn().mockResolvedValue({ ok: true }),
      listPRs: vi.fn().mockResolvedValue([]),
      getPRDetail: vi.fn().mockResolvedValue({}),
      getPRDiff: vi.fn().mockResolvedValue(''),
      submitReview: vi.fn().mockResolvedValue(undefined),
      addComment: vi.fn().mockResolvedValue(undefined),
    },
    session: {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
    },
    window: {
      minimize: vi.fn().mockResolvedValue(undefined),
      maximize: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isMaximized: vi.fn().mockResolvedValue(false),
    },
    docs: {
      discover: vi.fn().mockResolvedValue({ files: [] }),
      readFile: vi.fn().mockResolvedValue({ content: '' }),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
    cr: {
      list: vi.fn().mockResolvedValue({ items: [] }),
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ cr: {}, specPath: '' }),
      readSpec: vi.fn().mockResolvedValue({ content: '' }),
      writeSpec: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue({ cr: {}, worktreePath: '' }),
      stop: vi.fn().mockResolvedValue(undefined),
      approve: vi.fn().mockResolvedValue({ cr: {} }),
      discard: vi.fn().mockResolvedValue(undefined),
      deleteAll: vi.fn().mockResolvedValue(undefined),
      debugReset: vi.fn().mockResolvedValue(undefined),
    },
    shell: {
      info: vi.fn().mockResolvedValue({ shell: '/bin/bash', platform: 'linux' }),
      openExternal: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as ReturnType<typeof createMockApi>;
}

export function installMockApi() {
  const api = createMockApi();
  vi.stubGlobal('window', { ...globalThis.window, aide: api });
  return api;
}
