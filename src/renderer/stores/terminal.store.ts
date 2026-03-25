import { create } from 'zustand';
import type { TerminalInstance } from '../../shared/types/terminal';
import { getApi } from '../lib/ipc';
import { terminalName } from '../lib/names';
import { getSettings } from './settings.store';

interface TerminalStore {
  terminals: Map<string, TerminalInstance>;
  createTerminal: (cwd: string, shell?: string, existingId?: string) => Promise<string>;
  registerTerminal: (terminal: TerminalInstance) => void;
  killTerminal: (id: string) => Promise<void>;
  updateTerminal: (id: string, partial: Partial<TerminalInstance>) => void;
  removeTerminal: (id: string) => void;
  getTitle: (id: string) => string;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminals: new Map(),

  createTerminal: async (cwd: string, shell?: string, existingId?: string) => {
    const id = existingId || crypto.randomUUID();
    const cols = 80;
    const rows = 24;

    // Pass undefined shell to let the main process detect it; never pass "default"
    const actualShell = (shell && shell !== 'default') ? shell : undefined;
    const response = await getApi().pty.create({ id, cwd, shell: actualShell, cols, rows });

    // Ensure terminal is in the correct directory after shell init
    setTimeout(() => {
      const quoted = cwd.includes("'") ? `"${cwd}"` : `'${cwd}'`;
      getApi().pty.write({ id, data: `cd ${quoted} && clear\r` });
    }, getSettings().timing.terminalInitDelay);

    const terminal: TerminalInstance = {
      id,
      pid: response.pid,
      cwd,
      shell: actualShell || 'default',
      title: terminalName(),
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

  registerTerminal: (terminal: TerminalInstance) => {
    set((state) => {
      const terminals = new Map(state.terminals);
      terminals.set(terminal.id, terminal);
      return { terminals };
    });
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

  getTitle: (id: string) => {
    return get().terminals.get(id)?.title || 'Terminal';
  },
}));
