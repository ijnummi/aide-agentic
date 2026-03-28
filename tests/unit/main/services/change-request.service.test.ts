import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
}));

import * as fs from 'node:fs/promises';
import { ChangeRequestService } from '../../../../src/main/services/change-request.service';
import type { WorktreeService } from '../../../../src/main/services/worktree.service';
import type { GitService } from '../../../../src/main/services/git.service';
import type { GitHubService } from '../../../../src/main/services/github.service';

const mockFs = vi.mocked(fs);

const mockWorktree = {
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  prune: vi.fn(),
} as unknown as WorktreeService;

const mockGit = {
  status: vi.fn(),
  stage: vi.fn(),
  commit: vi.fn(),
  merge: vi.fn(),
  branches: vi.fn(),
  deleteBranch: vi.fn(),
  push: vi.fn(),
} as unknown as GitService;

const mockGithub = {
  createPR: vi.fn(),
} as unknown as GitHubService;

let service: ChangeRequestService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new ChangeRequestService(mockWorktree, mockGit, mockGithub);
});

const SPEC_CONTENT = `---
type: feature
name: add-auth
status: draft
createdAt: 2025-01-15T10:00:00.000Z
updatedAt: 2025-01-15T10:00:00.000Z
branch: feature-add-auth
---

# feature-add-auth

Add authentication support
`;

describe('ChangeRequestService.get', () => {
  it('parses a spec file into a ChangeRequest', async () => {
    mockFs.readFile.mockResolvedValue(SPEC_CONTENT);

    const cr = await service.get('/project', 'feature-add-auth');
    expect(cr).not.toBeNull();
    expect(cr!.id).toBe('feature-add-auth');
    expect(cr!.type).toBe('feature');
    expect(cr!.name).toBe('add-auth');
    expect(cr!.status).toBe('draft');
    expect(cr!.branch).toBe('feature-add-auth');
    expect(cr!.description).toBe('# feature-add-auth\n\nAdd authentication support');
  });

  it('returns null when spec file does not exist', async () => {
    mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
    const cr = await service.get('/project', 'nonexistent');
    expect(cr).toBeNull();
  });
});

describe('ChangeRequestService.list', () => {
  it('lists and sorts CRs by updatedAt descending', async () => {
    mockFs.readdir.mockResolvedValue(['cr-a', 'cr-b'] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
    mockFs.readFile
      .mockResolvedValueOnce(`---\ntype: feature\nname: a\nstatus: draft\nupdatedAt: 2025-01-10T00:00:00.000Z\n---\nBody A\n`)
      .mockResolvedValueOnce(`---\ntype: bug\nname: b\nstatus: running\nupdatedAt: 2025-01-15T00:00:00.000Z\n---\nBody B\n`);

    const result = await service.list('/project');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('b'); // newer first
    expect(result.items[1].name).toBe('a');
  });

  it('returns empty list when directory does not exist', async () => {
    mockFs.readdir.mockRejectedValue(new Error('ENOENT'));
    const result = await service.list('/project');
    expect(result.items).toEqual([]);
  });
});

describe('ChangeRequestService.create', () => {
  it('creates spec file and returns CR', async () => {
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const result = await service.create('/project', 'feature', 'login', 'Add login page');
    expect(result.cr.id).toBe('feature-login');
    expect(result.cr.type).toBe('feature');
    expect(result.cr.name).toBe('login');
    expect(result.cr.status).toBe('draft');
    expect(result.cr.branch).toBe('feature-login');
    expect(mockFs.mkdir).toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalled();
  });
});

describe('ChangeRequestService.readSpec', () => {
  it('returns spec content', async () => {
    mockFs.readFile.mockResolvedValue(SPEC_CONTENT);
    const result = await service.readSpec('/project', 'feature-add-auth');
    expect(result.content).toBe(SPEC_CONTENT);
  });
});

describe('ChangeRequestService.writeSpec', () => {
  it('updates updatedAt in frontmatter before writing', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);
    await service.writeSpec('/project', 'feature-add-auth', SPEC_CONTENT);
    const written = mockFs.writeFile.mock.calls[0][1] as string;
    // updatedAt should have been updated — createdAt keeps its original value
    // but updatedAt gets a new timestamp
    const updatedAtMatch = written.match(/updatedAt: (.+)/);
    expect(updatedAtMatch).not.toBeNull();
    expect(updatedAtMatch![1]).not.toBe('2025-01-15T10:00:00.000Z');
    // createdAt is still the original
    expect(written).toContain('createdAt: 2025-01-15T10:00:00.000Z');
  });
});

describe('frontmatter parsing edge cases', () => {
  it('returns null for spec with missing required fields', async () => {
    mockFs.readFile.mockResolvedValue('---\nstatus: draft\n---\nBody\n');
    const cr = await service.get('/project', 'bad-spec');
    expect(cr).toBeNull();
  });

  it('handles spec with extra fields', async () => {
    mockFs.readFile.mockResolvedValue(
      `---\ntype: bug\nname: fix\nstatus: running\nworktreePath: /tmp/wt\nclaudeSessionId: ses-1\nprNumber: 42\n---\nBody\n`,
    );
    const cr = await service.get('/project', 'bug-fix');
    expect(cr!.worktreePath).toBe('/tmp/wt');
    expect(cr!.claudeSessionId).toBe('ses-1');
    expect(cr!.prNumber).toBe(42);
  });
});
