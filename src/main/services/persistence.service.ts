import Store from 'electron-store';
import type { SessionState, SessionMeta, PersistenceSchema } from '../../shared/types/persistence';

export class PersistenceService {
  private store: Store<PersistenceSchema>;

  constructor() {
    this.store = new Store<PersistenceSchema>({
      name: 'aide-sessions',
      defaults: {
        sessions: {},
        recentProjects: [],
      },
    });
  }

  saveSession(state: SessionState): void {
    const sessions = this.store.get('sessions', {});
    sessions[state.projectPath] = state;
    this.store.set('sessions', sessions);

    // Update recent projects
    const recent = this.store.get('recentProjects', []);
    const filtered = recent.filter((r) => r.path !== state.projectPath);
    filtered.unshift({ path: state.projectPath, lastOpened: Date.now() });
    this.store.set('recentProjects', filtered.slice(0, 20));
  }

  loadSession(projectPath: string): SessionState | null {
    const sessions = this.store.get('sessions', {});
    return sessions[projectPath] || null;
  }

  listSessions(): SessionMeta[] {
    const sessions = this.store.get('sessions', {});
    return Object.values(sessions).map((s) => ({
      projectPath: s.projectPath,
      savedAt: s.savedAt,
    }));
  }

  deleteSession(projectPath: string): void {
    const sessions = this.store.get('sessions', {});
    delete sessions[projectPath];
    this.store.set('sessions', sessions);
  }
}
