import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type { DocsDiscoverRequest, DocsReadRequest } from '../../shared/types/docs';
import type { DocsService } from '../services/docs.service';

export function registerDocsHandlers(docsService: DocsService) {
  ipcMain.handle(IPC.DOCS_DISCOVER, (_event, req: DocsDiscoverRequest) => {
    return docsService.discover(req.cwd);
  });

  ipcMain.handle(IPC.DOCS_READ, (_event, req: DocsReadRequest) => {
    return docsService.readFile(req.filePath);
  });
}
