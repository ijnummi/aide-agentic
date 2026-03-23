import { ipcMain } from 'electron';
import { IPC } from '../../shared/constants';
import type {
  GitHubAuthRequest,
  GitHubPRsRequest,
  GitHubPRDetailRequest,
  GitHubPRReviewRequest,
  GitHubPRCommentRequest,
} from '../../shared/types/github';
import type { GitHubService } from '../services/github.service';

export function registerGitHubHandlers(githubService: GitHubService) {
  ipcMain.handle(IPC.GITHUB_AUTH, (_event, req: GitHubAuthRequest) => {
    githubService.authenticate(req.token);
    return { ok: true };
  });

  ipcMain.handle(IPC.GITHUB_PRS, (_event, req: GitHubPRsRequest) => {
    return githubService.listPRs(req.cwd, req.state);
  });

  ipcMain.handle(IPC.GITHUB_PR_DETAIL, (_event, req: GitHubPRDetailRequest) => {
    return githubService.getPRDetail(req.cwd, req.number);
  });

  ipcMain.handle(IPC.GITHUB_PR_DIFF, (_event, cwd: string, number: number) => {
    return githubService.getPRDiff(cwd, number);
  });

  ipcMain.handle(IPC.GITHUB_PR_REVIEW, (_event, req: GitHubPRReviewRequest) => {
    return githubService.submitReview(req.cwd, req.number, req.event, req.body);
  });

  ipcMain.handle(IPC.GITHUB_PR_COMMENT, (_event, req: GitHubPRCommentRequest) => {
    return githubService.addComment(req.cwd, req.number, req.body);
  });
}
