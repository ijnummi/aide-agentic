import { create } from 'zustand';
import type {
  ClaudeSession,
  ClaudeMessage,
  ClaudeSessionStatus,
} from '../../shared/types/claude';

interface ClaudeStore {
  sessions: Map<string, ClaudeSession>;
  activeSessionId: string | null;

  createSession: (cwd: string, worktreeId?: string) => string;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  updateSessionStatus: (sessionId: string, status: ClaudeSessionStatus, error?: string) => void;
  addMessage: (sessionId: string, message: ClaudeMessage) => void;
  updateLastMessage: (sessionId: string, message: ClaudeMessage) => void;
  setClaudeSessionId: (sessionId: string, claudeSessionId: string) => void;
  setCost: (sessionId: string, cost: number) => void;
  addUserMessage: (sessionId: string, prompt: string) => void;
}

export const useClaudeStore = create<ClaudeStore>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,

  createSession: (cwd: string, worktreeId?: string) => {
    const id = crypto.randomUUID();
    const session: ClaudeSession = {
      id,
      cwd,
      worktreeId,
      status: 'starting',
      messages: [],
      createdAt: Date.now(),
    };
    set((state) => {
      const sessions = new Map(state.sessions);
      sessions.set(id, session);
      return { sessions, activeSessionId: id };
    });
    return id;
  },

  removeSession: (sessionId: string) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      sessions.delete(sessionId);
      const activeSessionId =
        state.activeSessionId === sessionId ? null : state.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  setActiveSession: (sessionId: string | null) => {
    set({ activeSessionId: sessionId });
  },

  updateSessionStatus: (sessionId, status, error) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      const session = sessions.get(sessionId);
      if (session) {
        sessions.set(sessionId, { ...session, status, error: error || session.error });
      }
      return { sessions };
    });
  },

  addMessage: (sessionId, message) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      const session = sessions.get(sessionId);
      if (session) {
        sessions.set(sessionId, {
          ...session,
          messages: [...session.messages, message],
        });
      }
      return { sessions };
    });
  },

  updateLastMessage: (sessionId, message) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      const session = sessions.get(sessionId);
      if (session && session.messages.length > 0) {
        const messages = [...session.messages];
        messages[messages.length - 1] = message;
        sessions.set(sessionId, { ...session, messages });
      }
      return { sessions };
    });
  },

  setClaudeSessionId: (sessionId, claudeSessionId) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      const session = sessions.get(sessionId);
      if (session) {
        sessions.set(sessionId, { ...session, claudeSessionId });
      }
      return { sessions };
    });
  },

  setCost: (sessionId, cost) => {
    set((state) => {
      const sessions = new Map(state.sessions);
      const session = sessions.get(sessionId);
      if (session) {
        sessions.set(sessionId, { ...session, cost });
      }
      return { sessions };
    });
  },

  addUserMessage: (sessionId, prompt) => {
    const message: ClaudeMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      blocks: [{ type: 'text', text: prompt }],
      timestamp: Date.now(),
    };
    get().addMessage(sessionId, message);
  },
}));
