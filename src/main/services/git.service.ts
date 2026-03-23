import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  GitStatusResponse,
  GitLogEntry,
  FileChange,
} from '../../shared/types/git';

const exec = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

export class GitService {
  async status(cwd: string): Promise<GitStatusResponse> {
    const output = await git(cwd, ['status', '--porcelain=v2', '--branch']);
    const lines = output.split('\n');

    let branch = '';
    let upstream = '';
    let ahead = 0;
    let behind = 0;
    const staged: FileChange[] = [];
    const unstaged: FileChange[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        branch = line.slice('# branch.head '.length);
      } else if (line.startsWith('# branch.upstream ')) {
        upstream = line.slice('# branch.upstream '.length);
      } else if (line.startsWith('# branch.ab ')) {
        const match = line.match(/\+(\d+) -(\d+)/);
        if (match) {
          ahead = parseInt(match[1], 10);
          behind = parseInt(match[2], 10);
        }
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        // Changed entry
        const parts = line.split(' ');
        const xy = parts[1];
        const path = line.startsWith('2 ')
          ? parts.slice(9).join(' ').split('\t').pop() || ''
          : parts.slice(8).join(' ');

        if (xy[0] !== '.') {
          staged.push({ path, status: parseStatus(xy[0]) });
        }
        if (xy[1] !== '.') {
          unstaged.push({ path, status: parseStatus(xy[1]) });
        }
      } else if (line.startsWith('? ')) {
        untracked.push(line.slice(2));
      }
    }

    return { branch, upstream, ahead, behind, staged, unstaged, untracked };
  }

  async diff(cwd: string, staged?: boolean, file?: string): Promise<string> {
    const args = ['diff'];
    if (staged) args.push('--staged');
    if (file) args.push('--', file);
    return git(cwd, args);
  }

  async log(cwd: string, count = 20): Promise<GitLogEntry[]> {
    const format = '%H%n%h%n%an%n%ai%n%s';
    const output = await git(cwd, ['log', `--format=${format}`, `-n`, String(count)]);
    const lines = output.split('\n');
    const entries: GitLogEntry[] = [];

    for (let i = 0; i + 4 < lines.length; i += 5) {
      entries.push({
        hash: lines[i],
        shortHash: lines[i + 1],
        author: lines[i + 2],
        date: lines[i + 3],
        message: lines[i + 4],
      });
    }

    return entries;
  }

  async stage(cwd: string, files: string[]): Promise<void> {
    await git(cwd, ['add', ...files]);
  }

  async unstage(cwd: string, files: string[]): Promise<void> {
    await git(cwd, ['reset', 'HEAD', '--', ...files]);
  }

  async commit(cwd: string, message: string): Promise<void> {
    await git(cwd, ['commit', '-m', message]);
  }

  async branches(cwd: string): Promise<string[]> {
    const output = await git(cwd, ['branch', '--format=%(refname:short)']);
    return output.split('\n').filter(Boolean);
  }

  async checkout(cwd: string, branch: string): Promise<void> {
    await git(cwd, ['checkout', branch]);
  }

  async getRemoteUrl(cwd: string): Promise<string | null> {
    try {
      const output = await git(cwd, ['remote', 'get-url', 'origin']);
      return output.trim() || null;
    } catch {
      return null;
    }
  }
}

function parseStatus(code: string): FileChange['status'] {
  switch (code) {
    case 'A': return 'added';
    case 'M': return 'modified';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    case 'C': return 'copied';
    default: return 'modified';
  }
}
