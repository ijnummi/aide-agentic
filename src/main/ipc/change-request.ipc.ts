import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type {
  CRListRequest,
  CRGetRequest,
  CRCreateRequest,
  CRReadSpecRequest,
  CRWriteSpecRequest,
  CRStartRequest,
  CRStopRequest,
  CRApproveRequest,
  CRDiscardRequest,
} from '../../shared/types/change-request';
import type { ChangeRequestService } from '../services/change-request.service';

export function registerChangeRequestHandlers(crService: ChangeRequestService) {
  ipcMain.handle(IPC.CR_LIST, (_event, req: CRListRequest) => {
    return crService.list(req.cwd);
  });

  ipcMain.handle(IPC.CR_GET, (_event, req: CRGetRequest) => {
    return crService.get(req.cwd, req.crId);
  });

  ipcMain.handle(IPC.CR_CREATE, (_event, req: CRCreateRequest) => {
    return crService.create(req.cwd, req.type, req.name, req.description);
  });

  ipcMain.handle(IPC.CR_READ_SPEC, (_event, req: CRReadSpecRequest) => {
    return crService.readSpec(req.cwd, req.crId);
  });

  ipcMain.handle(IPC.CR_WRITE_SPEC, (_event, req: CRWriteSpecRequest) => {
    return crService.writeSpec(req.cwd, req.crId, req.content);
  });

  ipcMain.handle(IPC.CR_START, (_event, req: CRStartRequest) => {
    return crService.start(req.cwd, req.crId);
  });

  ipcMain.handle(IPC.CR_STOP, (_event, req: CRStopRequest) => {
    return crService.stop(req.cwd, req.crId);
  });

  ipcMain.handle(IPC.CR_APPROVE, (_event, req: CRApproveRequest) => {
    return crService.approve(req.cwd, req.crId, req.strategy);
  });

  ipcMain.handle(IPC.CR_DISCARD, (_event, req: CRDiscardRequest) => {
    return crService.discard(req.cwd, req.crId);
  });

  ipcMain.handle(IPC.CR_DELETE_ALL, (_event, req: CRListRequest) => {
    return crService.deleteAll(req.cwd);
  });

  ipcMain.handle(IPC.CR_DEBUG_RESET, (_event, req: CRListRequest) => {
    return crService.debugReset(req.cwd);
  });
}
