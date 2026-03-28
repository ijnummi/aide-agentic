import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installMockApi } from './helpers/mock-api';

const api = installMockApi();

import { useGitStore } from '../../../../src/renderer/stores/git.store';

function resetStore() {
  useGitStore.setState({
    cwd: '/project',
    branch: '',
    upstream: '',
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    branches: [],
    log: [],
    isLoading: false,
    lastUpdated: 0,
  });
  vi.clearAllMocks();
}

describe('git store', () => {
  beforeEach(resetStore);

  describe('refresh', () => {
    it('populates status fields from IPC', async () => {
      api.git.status.mockResolvedValue({
        branch: 'feature',
        upstream: 'origin/feature',
        ahead: 1,
        behind: 2,
        staged: [{ path: 'a.ts', status: 'modified' }],
        unstaged: [{ path: 'b.ts', status: 'added' }],
        untracked: ['c.ts'],
      });
      api.git.log.mockResolvedValue([]);

      await useGitStore.getState().refresh();

      const state = useGitStore.getState();
      expect(state.branch).toBe('feature');
      expect(state.upstream).toBe('origin/feature');
      expect(state.ahead).toBe(1);
      expect(state.behind).toBe(2);
      expect(state.staged).toHaveLength(1);
      expect(state.unstaged).toHaveLength(1);
      expect(state.untracked).toEqual(['c.ts']);
      expect(state.isLoading).toBe(false);
    });

    it('triggers refreshLog', async () => {
      api.git.status.mockResolvedValue({ branch: 'main', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] });
      api.git.log.mockResolvedValue([{ hash: 'abc', shortHash: 'abc', author: 'me', date: '2025-01-01', message: 'init' }]);

      await useGitStore.getState().refresh();
      // Wait for the fire-and-forget refreshLog
      await vi.waitFor(() => expect(api.git.log).toHaveBeenCalled());
    });

    it('does nothing when cwd is empty', async () => {
      useGitStore.setState({ cwd: '' });
      await useGitStore.getState().refresh();
      expect(api.git.status).not.toHaveBeenCalled();
    });
  });

  describe('stage', () => {
    it('calls IPC and refreshes', async () => {
      api.git.status.mockResolvedValue({ branch: 'main', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] });
      api.git.log.mockResolvedValue([]);

      await useGitStore.getState().stage(['file.ts']);
      expect(api.git.stage).toHaveBeenCalledWith('/project', ['file.ts']);
      expect(api.git.status).toHaveBeenCalled();
    });
  });

  describe('commit', () => {
    it('calls IPC and refreshes', async () => {
      api.git.status.mockResolvedValue({ branch: 'main', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] });
      api.git.log.mockResolvedValue([]);

      await useGitStore.getState().commit('fix bug');
      expect(api.git.commit).toHaveBeenCalledWith('/project', 'fix bug');
      expect(api.git.status).toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('calls IPC, refreshes status and branches', async () => {
      api.git.status.mockResolvedValue({ branch: 'develop', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] });
      api.git.branches.mockResolvedValue(['main', 'develop']);
      api.git.log.mockResolvedValue([]);

      await useGitStore.getState().checkout('develop');
      expect(api.git.checkout).toHaveBeenCalledWith('/project', 'develop');
      expect(api.git.branches).toHaveBeenCalled();
    });
  });

  describe('getDiff', () => {
    it('calls IPC and parses diff', async () => {
      api.git.diff.mockResolvedValue(
        'diff --git a/f.ts b/f.ts\nindex 111..222 100644\n--- a/f.ts\n+++ b/f.ts\n@@ -1,1 +1,1 @@\n-old\n+new\n',
      );

      const files = await useGitStore.getState().getDiff(true, 'f.ts');
      expect(files).toHaveLength(1);
      expect(files[0].oldPath).toBe('f.ts');
      expect(api.git.diff).toHaveBeenCalledWith({ cwd: '/project', staged: true, file: 'f.ts' });
    });
  });

  describe('getCommitDiff', () => {
    it('calls git show IPC and parses diff', async () => {
      api.git.show.mockResolvedValue(
        'diff --git a/x.ts b/x.ts\nindex 111..222 100644\n--- a/x.ts\n+++ b/x.ts\n@@ -1,1 +1,1 @@\n-a\n+b\n',
      );

      const files = await useGitStore.getState().getCommitDiff('abc123');
      expect(files).toHaveLength(1);
      expect(api.git.show).toHaveBeenCalledWith('/project', 'abc123');
    });
  });

  describe('refreshBranches', () => {
    it('populates branches', async () => {
      api.git.branches.mockResolvedValue(['main', 'dev']);
      await useGitStore.getState().refreshBranches();
      expect(useGitStore.getState().branches).toEqual(['main', 'dev']);
    });
  });
});
