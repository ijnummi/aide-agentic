import { ipcMain, type BrowserWindow } from 'electron';
import { IPC } from '../../shared/constants';
import type {
  ClaudeStartRequest,
  ClaudeStopRequest,
} from '../../shared/types/claude';
import type { ClaudeService } from '../services/claude.service';

export function registerClaudeHandlers(
  claudeService: ClaudeService,
  getWindow: () => BrowserWindow | null,
) {
  const getCallbacks = () => ({
    onEvent: (event: unknown) => {
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC.CLAUDE_EVENT, event);
      }
    },
    onStatus: (status: unknown) => {
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC.CLAUDE_STATUS, status);
      }
    },
  });

  ipcMain.handle(IPC.CLAUDE_START, (_event, request: ClaudeStartRequest) => {
    claudeService.start(request, getCallbacks());
  });

  ipcMain.handle(IPC.CLAUDE_STOP, (_event, request: ClaudeStopRequest) => {
    claudeService.stop(request.sessionId);
  });
}
