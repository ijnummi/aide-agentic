import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installMockApi } from './helpers/mock-api';

let counter = 0;
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++counter}` });

const api = installMockApi();

import { useTerminalStore } from '../../../../src/renderer/stores/terminal.store';
import type { TerminalInstance } from '../../../../src/shared/types/terminal';

function resetStore() {
  useTerminalStore.setState({ terminals: new Map() });
  counter = 0;
  vi.clearAllMocks();
}

describe('terminal store', () => {
  beforeEach(resetStore);

  describe('createTerminal', () => {
    it('calls pty.create and adds terminal to map', async () => {
      api.pty.create.mockResolvedValue({ id: 'uuid-1', pid: 42 });

      const id = await useTerminalStore.getState().createTerminal('/project');
      expect(id).toBe('uuid-1');
      expect(api.pty.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'uuid-1', cwd: '/project' }),
      );

      const terminals = useTerminalStore.getState().terminals;
      expect(terminals.size).toBe(1);
      const t = terminals.get('uuid-1')!;
      expect(t.pid).toBe(42);
      expect(t.cwd).toBe('/project');
      expect(t.status).toBe('running');
    });

    it('uses existingId when provided', async () => {
      api.pty.create.mockResolvedValue({ id: 'my-id', pid: 99 });
      const id = await useTerminalStore.getState().createTerminal('/project', undefined, 'my-id');
      expect(id).toBe('my-id');
    });

    it('passes shell to pty.create when not default', async () => {
      api.pty.create.mockResolvedValue({ id: 'uuid-1', pid: 1 });
      await useTerminalStore.getState().createTerminal('/project', '/bin/zsh');
      expect(api.pty.create).toHaveBeenCalledWith(
        expect.objectContaining({ shell: '/bin/zsh' }),
      );
    });

    it('passes undefined shell when "default"', async () => {
      api.pty.create.mockResolvedValue({ id: 'uuid-1', pid: 1 });
      await useTerminalStore.getState().createTerminal('/project', 'default');
      expect(api.pty.create).toHaveBeenCalledWith(
        expect.objectContaining({ shell: undefined }),
      );
    });
  });

  describe('killTerminal', () => {
    it('calls pty.kill and removes from map', async () => {
      api.pty.create.mockResolvedValue({ id: 'uuid-1', pid: 1 });
      await useTerminalStore.getState().createTerminal('/project');

      await useTerminalStore.getState().killTerminal('uuid-1');
      expect(api.pty.kill).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(useTerminalStore.getState().terminals.size).toBe(0);
    });
  });

  describe('registerTerminal', () => {
    it('adds a pre-created terminal', () => {
      const t: TerminalInstance = {
        id: 't1',
        pid: 100,
        cwd: '/x',
        shell: 'bash',
        title: 'Test',
        status: 'running',
        createdAt: Date.now(),
      };
      useTerminalStore.getState().registerTerminal(t);
      expect(useTerminalStore.getState().terminals.get('t1')).toEqual(t);
    });
  });

  describe('updateTerminal', () => {
    it('merges partial updates', () => {
      const t: TerminalInstance = {
        id: 't1', pid: 1, cwd: '/a', shell: 'bash', title: 'T', status: 'running', createdAt: 0,
      };
      useTerminalStore.getState().registerTerminal(t);
      useTerminalStore.getState().updateTerminal('t1', { title: 'Updated' });
      expect(useTerminalStore.getState().terminals.get('t1')!.title).toBe('Updated');
      expect(useTerminalStore.getState().terminals.get('t1')!.cwd).toBe('/a');
    });
  });

  describe('getTitle', () => {
    it('returns terminal title', () => {
      const t: TerminalInstance = {
        id: 't1', pid: 1, cwd: '/a', shell: 'bash', title: 'MyTerm', status: 'running', createdAt: 0,
      };
      useTerminalStore.getState().registerTerminal(t);
      expect(useTerminalStore.getState().getTitle('t1')).toBe('MyTerm');
    });

    it('returns fallback for unknown id', () => {
      expect(useTerminalStore.getState().getTitle('nope')).toBe('Terminal');
    });
  });

  describe('removeTerminal', () => {
    it('removes without calling IPC', () => {
      const t: TerminalInstance = {
        id: 't1', pid: 1, cwd: '/a', shell: 'bash', title: 'T', status: 'running', createdAt: 0,
      };
      useTerminalStore.getState().registerTerminal(t);
      useTerminalStore.getState().removeTerminal('t1');
      expect(useTerminalStore.getState().terminals.size).toBe(0);
      expect(api.pty.kill).not.toHaveBeenCalled();
    });
  });
});
