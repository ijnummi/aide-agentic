import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { WorktreeInfo } from '../../shared/types/worktree';

const exec = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

export class WorktreeService {
  async list(cwd: string): Promise<WorktreeInfo[]> {
    const output = await git(cwd, ['worktree', 'list', '--porcelain']);
    const worktrees: WorktreeInfo[] = [];
    let current: Partial<WorktreeInfo> = {};

    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as WorktreeInfo);
        }
        current = { path: line.slice('worktree '.length), isMain: false };
      } else if (line.startsWith('HEAD ')) {
        current.head = line.slice('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length);
        current.branch = ref.replace('refs/heads/', '');
      } else if (line === 'bare') {
        current.bare = true;
      } else if (line === '') {
        // Block separator — first worktree is main
        if (current.path && worktrees.length === 0) {
          current.isMain = true;
        }
      }
    }

    if (current.path) {
      if (worktrees.length === 0) current.isMain = true;
      worktrees.push(current as WorktreeInfo);
    }

    return worktrees;
  }

  async add(cwd: string, path: string, branch: string, createBranch?: boolean): Promise<WorktreeInfo> {
    const args = ['worktree', 'add'];
    if (createBranch) {
      args.push('-b', branch, path);
    } else {
      args.push(path, branch);
    }
    await git(cwd, args);

    // Return the new worktree info
    const list = await this.list(cwd);
    const added = list.find((w) => w.path === path || w.path.endsWith(path));
    return added || { path, branch, head: '', isMain: false };
  }

  async remove(cwd: string, path: string, force?: boolean): Promise<void> {
    const args = ['worktree', 'remove'];
    if (force) args.push('--force');
    args.push(path);
    await git(cwd, args);
  }

  async prune(cwd: string): Promise<void> {
    await git(cwd, ['worktree', 'prune']);
  }
}
