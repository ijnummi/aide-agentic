import { create } from 'zustand';
import type { TerminalInstance } from '../../shared/types/terminal';
import { getApi } from '../lib/ipc';

interface TerminalStore {
  terminals: Map<string, TerminalInstance>;
  createTerminal: (cwd: string, shell?: string) => Promise<string>;
  killTerminal: (id: string) => Promise<void>;
  updateTerminal: (id: string, partial: Partial<TerminalInstance>) => void;
  removeTerminal: (id: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminals: new Map(),

  createTerminal: async (cwd: string, shell?: string) => {
    const id = crypto.randomUUID();
    const cols = 80;
    const rows = 24;

    const response = await getApi().pty.create({ id, cwd, shell, cols, rows });

    const terminal: TerminalInstance = {
      id,
      pid: response.pid,
      cwd,
      shell: shell || 'default',
      title: `Terminal ${get().terminals.size + 1}`,
      status: 'running',
      createdAt: Date.now(),
    };

    set((state) => {
      const terminals = new Map(state.terminals);
      terminals.set(id, terminal);
      return { terminals };
    });

    return id;
  },

  killTerminal: async (id: string) => {
    await getApi().pty.kill({ id });
    set((state) => {
      const terminals = new Map(state.terminals);
      terminals.delete(id);
      return { terminals };
    });
  },

  updateTerminal: (id: string, partial: Partial<TerminalInstance>) => {
    set((state) => {
      const terminals = new Map(state.terminals);
      const existing = terminals.get(id);
      if (existing) {
        terminals.set(id, { ...existing, ...partial });
      }
      return { terminals };
    });
  },

  removeTerminal: (id: string) => {
    set((state) => {
      const terminals = new Map(state.terminals);
      terminals.delete(id);
      return { terminals };
    });
  },
}));
