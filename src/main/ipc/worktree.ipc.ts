import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type { WorktreeAddRequest, WorktreeRemoveRequest } from '../../shared/types/worktree';
import type { WorktreeService } from '../services/worktree.service';

export function registerWorktreeHandlers(worktreeService: WorktreeService) {
  ipcMain.handle(IPC.WORKTREE_LIST, (_event, cwd: string) => {
    return worktreeService.list(cwd);
  });

  ipcMain.handle(IPC.WORKTREE_ADD, (_event, req: WorktreeAddRequest) => {
    return worktreeService.add(req.cwd, req.path, req.branch, req.createBranch);
  });

  ipcMain.handle(IPC.WORKTREE_REMOVE, (_event, req: WorktreeRemoveRequest) => {
    return worktreeService.remove(req.cwd, req.path, req.force);
  });

  ipcMain.handle(IPC.WORKTREE_PRUNE, (_event, cwd: string) => {
    return worktreeService.prune(cwd);
  });
}
