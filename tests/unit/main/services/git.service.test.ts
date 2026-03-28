import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));
vi.mock('node:util', () => ({
  promisify: (fn: unknown) => fn,
}));

import { execFile } from 'node:child_process';
import { GitService } from '../../../../src/main/services/git.service';

const mockExec = vi.mocked(execFile as unknown as (...args: unknown[]) => Promise<{ stdout: string }>);

let git: GitService;

beforeEach(() => {
  vi.clearAllMocks();
  git = new GitService();
});

describe('GitService.status', () => {
  it('parses porcelain v2 branch info', async () => {
    mockExec.mockResolvedValue({
      stdout: [
        '# branch.oid abc123',
        '# branch.head main',
        '# branch.upstream origin/main',
        '# branch.ab +2 -1',
        '',
      ].join('\n'),
    });

    const result = await git.status('/project');
    expect(result.branch).toBe('main');
    expect(result.upstream).toBe('origin/main');
    expect(result.ahead).toBe(2);
    expect(result.behind).toBe(1);
  });

  it('parses staged and unstaged changes', async () => {
    mockExec.mockResolvedValue({
      stdout: [
        '# branch.head main',
        '1 M. N... 100644 100644 100644 abc def src/app.ts',
        '1 .M N... 100644 100644 100644 abc def src/lib.ts',
        '',
      ].join('\n'),
    });

    const result = await git.status('/project');
    expect(result.staged).toEqual([{ path: 'src/app.ts', status: 'modified' }]);
    expect(result.unstaged).toEqual([{ path: 'src/lib.ts', status: 'modified' }]);
  });

  it('parses untracked files', async () => {
    mockExec.mockResolvedValue({
      stdout: [
        '# branch.head main',
        '? new-file.ts',
        '? another.ts',
        '',
      ].join('\n'),
    });

    const result = await git.status('/project');
    expect(result.untracked).toEqual(['new-file.ts', 'another.ts']);
  });

  it('parses added and deleted statuses', async () => {
    mockExec.mockResolvedValue({
      stdout: [
        '# branch.head main',
        '1 A. N... 100644 100644 100644 000 abc added.ts',
        '1 D. N... 100644 100644 100644 abc 000 deleted.ts',
        '',
      ].join('\n'),
    });

    const result = await git.status('/project');
    expect(result.staged).toEqual([
      { path: 'added.ts', status: 'added' },
      { path: 'deleted.ts', status: 'deleted' },
    ]);
  });
});

describe('GitService.log', () => {
  it('parses log entries from custom format', async () => {
    mockExec.mockResolvedValue({
      stdout: [
        'abc123full',
        'abc123',
        'John Doe',
        '2025-01-15 10:00:00 +0200',
        'Fix the thing',
        'def456full',
        'def456',
        'Jane Doe',
        '2025-01-14 09:00:00 +0200',
        'Add feature',
        '',
      ].join('\n'),
    });

    const entries = await git.log('/project', 2);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      hash: 'abc123full',
      shortHash: 'abc123',
      author: 'John Doe',
      date: '2025-01-15 10:00:00 +0200',
      message: 'Fix the thing',
    });
    expect(entries[1].message).toBe('Add feature');
  });

  it('returns empty array for empty output', async () => {
    mockExec.mockResolvedValue({ stdout: '' });
    const entries = await git.log('/project');
    expect(entries).toEqual([]);
  });
});

describe('GitService.diff', () => {
  it('passes --staged flag when staged is true', async () => {
    mockExec.mockResolvedValue({ stdout: 'diff output' });
    await git.diff('/project', true);
    expect(mockExec).toHaveBeenCalledWith(
      'git', ['diff', '--staged'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });

  it('passes file path when specified', async () => {
    mockExec.mockResolvedValue({ stdout: '' });
    await git.diff('/project', false, 'src/app.ts');
    expect(mockExec).toHaveBeenCalledWith(
      'git', ['diff', '--', 'src/app.ts'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });
});
