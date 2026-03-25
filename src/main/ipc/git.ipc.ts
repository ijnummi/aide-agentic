import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type { GitDiffRequest } from '../../shared/types/git';
import type { GitService } from '../services/git.service';

export function registerGitHandlers(gitService: GitService) {
  ipcMain.handle(IPC.GIT_STATUS, (_event, cwd: string) => {
    return gitService.status(cwd);
  });

  ipcMain.handle(IPC.GIT_DIFF, (_event, req: GitDiffRequest) => {
    return gitService.diff(req.cwd, req.staged, req.file);
  });

  ipcMain.handle(IPC.GIT_LOG, (_event, cwd: string, count?: number) => {
    return gitService.log(cwd, count);
  });

  ipcMain.handle(IPC.GIT_STAGE, (_event, cwd: string, files: string[]) => {
    return gitService.stage(cwd, files);
  });

  ipcMain.handle(IPC.GIT_COMMIT, (_event, cwd: string, message: string) => {
    return gitService.commit(cwd, message);
  });

  ipcMain.handle(IPC.GIT_BRANCHES, (_event, cwd: string) => {
    return gitService.branches(cwd);
  });

  ipcMain.handle(IPC.GIT_CHECKOUT, (_event, cwd: string, branch: string) => {
    return gitService.checkout(cwd, branch);
  });

  ipcMain.handle(IPC.GIT_REVERT_ALL, (_event, cwd: string) => {
    return gitService.revertAll(cwd);
  });
}
