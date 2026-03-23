import { ipcMain, type BrowserWindow } from 'electron';
import { IPC } from '../../shared/constants';
import type {
  PtyCreateRequest,
  PtyWriteRequest,
  PtyResizeRequest,
  PtyKillRequest,
} from '../../shared/types/terminal';
import type { PtyService } from '../services/pty.service';

export function registerPtyHandlers(ptyService: PtyService, getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.PTY_CREATE, (_event, request: PtyCreateRequest) => {
    const result = ptyService.create(request, {
      onData: (id, data) => {
        const win = getWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send(IPC.PTY_DATA, { id, data });
        }
      },
      onExit: (id, exitCode) => {
        const win = getWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send(IPC.PTY_EXIT, { id, exitCode });
        }
      },
    });
    return { id: request.id, pid: result.pid };
  });

  ipcMain.handle(IPC.PTY_WRITE, (_event, request: PtyWriteRequest) => {
    ptyService.write(request.id, request.data);
  });

  ipcMain.handle(IPC.PTY_RESIZE, (_event, request: PtyResizeRequest) => {
    ptyService.resize(request.id, request.cols, request.rows);
  });

  ipcMain.handle(IPC.PTY_KILL, (_event, request: PtyKillRequest) => {
    ptyService.kill(request.id);
  });
}
