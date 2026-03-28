import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ClaudeMessage } from '../../../../src/shared/types/claude';

let counter = 0;
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++counter}` });

import { useClaudeStore } from '../../../../src/renderer/stores/claude.store';

function resetStore() {
  useClaudeStore.setState({ sessions: new Map(), activeSessionId: null });
  counter = 0;
}

function msg(overrides: Partial<ClaudeMessage> = {}): ClaudeMessage {
  return {
    id: `msg-${++counter}`,
    role: 'assistant',
    blocks: [{ type: 'text', text: 'hello' }],
    timestamp: Date.now(),
    inputTokens: 10,
    outputTokens: 5,
    cacheCreationTokens: 2,
    cacheReadTokens: 1,
    ...overrides,
  };
}

describe('claude store', () => {
  beforeEach(resetStore);

  describe('createSession', () => {
    it('creates a session and sets it active', () => {
      const id = useClaudeStore.getState().createSession('/project');
      const { sessions, activeSessionId } = useClaudeStore.getState();
      expect(sessions.size).toBe(1);
      expect(activeSessionId).toBe(id);
      const session = sessions.get(id)!;
      expect(session.cwd).toBe('/project');
      expect(session.status).toBe('waiting');
      expect(session.messages).toEqual([]);
    });

    it('uses existingId when provided', () => {
      const id = useClaudeStore.getState().createSession('/project', undefined, 'my-id');
      expect(id).toBe('my-id');
    });

    it('stores worktreeId and model', () => {
      const id = useClaudeStore.getState().createSession('/project', 'wt-1', undefined, 'opus');
      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.worktreeId).toBe('wt-1');
      expect(session.model).toBe('opus');
    });
  });

  describe('removeSession', () => {
    it('removes the session from the map', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().removeSession(id);
      expect(useClaudeStore.getState().sessions.size).toBe(0);
    });

    it('clears activeSessionId if it was the active one', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().removeSession(id);
      expect(useClaudeStore.getState().activeSessionId).toBeNull();
    });

    it('preserves activeSessionId if removing a different session', () => {
      const id1 = useClaudeStore.getState().createSession('/a');
      const id2 = useClaudeStore.getState().createSession('/b');
      // id2 is now active
      useClaudeStore.getState().removeSession(id1);
      expect(useClaudeStore.getState().activeSessionId).toBe(id2);
    });
  });

  describe('setActiveSession', () => {
    it('changes the active session', () => {
      const id1 = useClaudeStore.getState().createSession('/a');
      useClaudeStore.getState().createSession('/b');
      useClaudeStore.getState().setActiveSession(id1);
      expect(useClaudeStore.getState().activeSessionId).toBe(id1);
    });
  });

  describe('addMessage', () => {
    it('appends message and accumulates tokens', () => {
      const id = useClaudeStore.getState().createSession('/project');
      const m = msg({ inputTokens: 100, outputTokens: 50, cacheCreationTokens: 10, cacheReadTokens: 5 });
      useClaudeStore.getState().addMessage(id, m);

      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.messages).toHaveLength(1);
      expect(session.totalInputTokens).toBe(100);
      expect(session.totalOutputTokens).toBe(50);
      expect(session.totalCacheCreation).toBe(10);
      expect(session.totalCacheRead).toBe(5);
    });

    it('accumulates tokens across multiple messages', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().addMessage(id, msg({ inputTokens: 10, outputTokens: 5 }));
      useClaudeStore.getState().addMessage(id, msg({ inputTokens: 20, outputTokens: 15 }));

      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.messages).toHaveLength(2);
      expect(session.totalInputTokens).toBe(30);
      expect(session.totalOutputTokens).toBe(20);
    });
  });

  describe('updateLastMessage', () => {
    it('replaces the last message', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().addMessage(id, msg({ id: 'first' }));
      useClaudeStore.getState().addMessage(id, msg({ id: 'second' }));

      const replacement = msg({ id: 'updated' });
      useClaudeStore.getState().updateLastMessage(id, replacement);

      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.messages).toHaveLength(2);
      expect(session.messages[1].id).toBe('updated');
      expect(session.messages[0].id).toBe('first');
    });
  });

  describe('updateSessionStatus', () => {
    it('updates status and error', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().updateSessionStatus(id, 'error', 'something broke');
      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.status).toBe('error');
      expect(session.error).toBe('something broke');
    });
  });

  describe('setClaudeSessionId', () => {
    it('sets the claude API session id', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().setClaudeSessionId(id, 'api-ses-1');
      expect(useClaudeStore.getState().sessions.get(id)!.claudeSessionId).toBe('api-ses-1');
    });
  });

  describe('setCost', () => {
    it('sets cost on session', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().setCost(id, 0.05);
      expect(useClaudeStore.getState().sessions.get(id)!.cost).toBe(0.05);
    });
  });

  describe('setModel', () => {
    it('sets model on session', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().setModel(id, 'sonnet');
      expect(useClaudeStore.getState().sessions.get(id)!.model).toBe('sonnet');
    });
  });

  describe('addUserMessage', () => {
    it('creates a user message with text block and adds it', () => {
      const id = useClaudeStore.getState().createSession('/project');
      useClaudeStore.getState().addUserMessage(id, 'hello world');
      const session = useClaudeStore.getState().sessions.get(id)!;
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe('user');
      expect(session.messages[0].blocks[0]).toEqual({ type: 'text', text: 'hello world' });
    });
  });
});
