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
    const SEP = '---commit-sep---';
    const format = `${SEP}%n%H%n%h%n%an%n%ai%n%s`;
    const output = await git(cwd, ['log', `--format=${format}`, '--shortstat', `-n`, String(count)]);
    const chunks = output.split(SEP).filter(Boolean);
    const entries: GitLogEntry[] = [];

    for (const chunk of chunks) {
      const lines = chunk.split('\n').filter((l) => l !== '');
      if (lines.length < 5) continue;

      const entry: GitLogEntry = {
        hash: lines[0],
        shortHash: lines[1],
        author: lines[2],
        date: lines[3],
        message: lines[4],
      };

      // shortstat line looks like: " 3 files changed, 10 insertions(+), 2 deletions(-)"
      const statLine = lines[5];
      if (statLine) {
        const filesMatch = statLine.match(/(\d+) file/);
        const addMatch = statLine.match(/(\d+) insertion/);
        const delMatch = statLine.match(/(\d+) deletion/);
        if (filesMatch) entry.filesChanged = parseInt(filesMatch[1], 10);
        if (addMatch) entry.additions = parseInt(addMatch[1], 10);
        if (delMatch) entry.deletions = parseInt(delMatch[1], 10);
      }

      entries.push(entry);
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

  async revertAll(cwd: string): Promise<void> {
    await git(cwd, ['checkout', '.']);
    await git(cwd, ['clean', '-fd']);
  }

  async merge(cwd: string, branch: string): Promise<void> {
    await git(cwd, ['merge', branch]);
  }

  async deleteBranch(cwd: string, branch: string, force?: boolean): Promise<void> {
    await git(cwd, ['branch', force ? '-D' : '-d', branch]);
  }

  async push(cwd: string, branch: string, setUpstream?: boolean): Promise<void> {
    const args = ['push'];
    if (setUpstream) args.push('-u', 'origin', branch);
    else args.push('origin', branch);
    await git(cwd, args);
  }

  async show(cwd: string, ref: string): Promise<string> {
    return git(cwd, ['show', ref, '--format=']);
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
