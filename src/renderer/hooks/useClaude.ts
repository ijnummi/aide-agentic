import { useEffect, useRef } from 'react';
import { getApi } from '../lib/ipc';
import { useClaudeStore } from '../stores/claude.store';
import { parseClaudeEvent } from '../lib/claude-message-parser';
import type { ClaudeStreamEvent, ClaudeStatusEvent } from '../../shared/types/claude';

export function useClaude() {
  const store = useClaudeStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubEvent = getApi().claude.onEvent((event: ClaudeStreamEvent) => {
      const update = parseClaudeEvent(event.event);
      if (!update) return;

      switch (update.type) {
        case 'new_message':
          store.addMessage(event.sessionId, update.message);
          break;
        case 'result':
          store.setClaudeSessionId(event.sessionId, update.claudeSessionId);
          if (update.cost !== undefined) {
            store.setCost(event.sessionId, update.cost);
          }
          store.updateSessionStatus(event.sessionId, 'waiting');
          break;
        case 'error':
          store.updateSessionStatus(event.sessionId, 'error', update.error);
          break;
      }
    });

    const unsubStatus = getApi().claude.onStatus((event: ClaudeStatusEvent) => {
      store.updateSessionStatus(event.sessionId, event.status, event.error);
    });

    cleanupRef.current = () => {
      unsubEvent();
      unsubStatus();
    };

    return () => cleanupRef.current?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Creates a session in the store only — does NOT spawn Claude yet.
  // Claude is spawned on the first sendMessage call.
  const startSession = (cwd: string) => {
    const sessionId = store.createSession(cwd);
    store.updateSessionStatus(sessionId, 'waiting');
    return sessionId;
  };

  const sendMessage = async (sessionId: string, prompt: string) => {
    const session = store.sessions.get(sessionId);
    if (!session) return;

    store.addUserMessage(sessionId, prompt);
    store.updateSessionStatus(sessionId, 'running');

    if (session.claudeSessionId) {
      // Subsequent message: resume existing Claude session
      await getApi().claude.start({
        sessionId,
        cwd: session.cwd,
        prompt,
        resume: session.claudeSessionId,
      });
    } else {
      // First message: start fresh Claude session
      await getApi().claude.start({
        sessionId,
        cwd: session.cwd,
        prompt,
      });
    }
  };

  const stopSession = async (sessionId: string) => {
    await getApi().claude.stop({ sessionId });
    store.updateSessionStatus(sessionId, 'stopped');
  };

  return { startSession, sendMessage, stopSession };
}
