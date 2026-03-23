import { getApi } from '../lib/ipc';
import { useClaudeStore } from '../stores/claude.store';
import { parseClaudeEvent } from '../lib/claude-message-parser';
import type { ClaudeStreamEvent, ClaudeStatusEvent } from '../../shared/types/claude';

// Global listener setup — runs once, not per hook instance
let listenersRegistered = false;

function ensureListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const store = useClaudeStore;

  getApi().claude.onEvent((event: ClaudeStreamEvent) => {
    const update = parseClaudeEvent(event.event);
    if (!update) return;

    switch (update.type) {
      case 'new_message':
        store.getState().addMessage(event.sessionId, update.message);
        break;
      case 'result':
        store.getState().setClaudeSessionId(event.sessionId, update.claudeSessionId);
        if (update.cost !== undefined) {
          store.getState().setCost(event.sessionId, update.cost);
        }
        store.getState().updateSessionStatus(event.sessionId, 'waiting');
        break;
      case 'error':
        store.getState().updateSessionStatus(event.sessionId, 'error', update.error);
        break;
    }
  });

  getApi().claude.onStatus((event: ClaudeStatusEvent) => {
    store.getState().updateSessionStatus(event.sessionId, event.status, event.error);
  });
}

export function useClaude() {
  ensureListeners();

  const store = useClaudeStore();

  const startSession = (cwd: string) => {
    return store.createSession(cwd);
  };

  const sendMessage = async (sessionId: string, prompt: string) => {
    const session = store.sessions.get(sessionId);
    if (!session) return;

    store.addUserMessage(sessionId, prompt);
    store.updateSessionStatus(sessionId, 'running');

    await getApi().claude.start({
      sessionId,
      cwd: session.cwd,
      prompt,
      model: session.model,
      resume: session.claudeSessionId,
    });
  };

  const stopSession = async (sessionId: string) => {
    await getApi().claude.stop({ sessionId });
    store.updateSessionStatus(sessionId, 'stopped');
  };

  return { startSession, sendMessage, stopSession };
}
