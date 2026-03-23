import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type { SessionState } from '../../shared/types/persistence';
import type { PersistenceService } from '../services/persistence.service';

export function registerPersistenceHandlers(persistenceService: PersistenceService) {
  ipcMain.handle(IPC.SESSION_SAVE, (_event, state: SessionState) => {
    persistenceService.saveSession(state);
  });

  ipcMain.handle(IPC.SESSION_LOAD, (_event, projectPath: string) => {
    return persistenceService.loadSession(projectPath);
  });

  ipcMain.handle(IPC.SESSION_LIST, () => {
    return persistenceService.listSessions();
  });
}
