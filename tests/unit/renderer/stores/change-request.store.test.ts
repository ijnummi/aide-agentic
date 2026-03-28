import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installMockApi } from './helpers/mock-api';

const api = installMockApi();

import { useChangeRequestStore } from '../../../../src/renderer/stores/change-request.store';

function resetStore() {
  useChangeRequestStore.setState({
    cwd: '/project',
    items: [],
    isLoading: false,
    filter: 'active',
  });
  vi.clearAllMocks();
}

const mockCR = {
  id: 'feature-auth',
  type: 'feature' as const,
  name: 'auth',
  status: 'draft' as const,
  description: 'Add auth',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  branch: 'feature-auth',
};

describe('change-request store', () => {
  beforeEach(resetStore);

  describe('refresh', () => {
    it('populates items from IPC', async () => {
      api.cr.list.mockResolvedValue({ items: [mockCR] });
      await useChangeRequestStore.getState().refresh();
      expect(useChangeRequestStore.getState().items).toEqual([mockCR]);
      expect(useChangeRequestStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during fetch', async () => {
      let resolve: () => void;
      api.cr.list.mockReturnValue(new Promise<{ items: typeof mockCR[] }>((r) => { resolve = () => r({ items: [] }); }));

      const promise = useChangeRequestStore.getState().refresh();
      expect(useChangeRequestStore.getState().isLoading).toBe(true);
      resolve!();
      await promise;
      expect(useChangeRequestStore.getState().isLoading).toBe(false);
    });

    it('sets empty items on error', async () => {
      useChangeRequestStore.setState({ items: [mockCR] });
      api.cr.list.mockRejectedValue(new Error('fail'));
      await useChangeRequestStore.getState().refresh();
      expect(useChangeRequestStore.getState().items).toEqual([]);
    });

    it('does nothing when cwd is empty', async () => {
      useChangeRequestStore.setState({ cwd: '' });
      await useChangeRequestStore.getState().refresh();
      expect(api.cr.list).not.toHaveBeenCalled();
    });
  });

  describe('setFilter', () => {
    it('updates filter', () => {
      useChangeRequestStore.getState().setFilter('approved');
      expect(useChangeRequestStore.getState().filter).toBe('approved');
    });
  });

  describe('create', () => {
    it('calls IPC and refreshes', async () => {
      const mockResult = { cr: mockCR, specPath: '/tmp/spec.md' };
      api.cr.create.mockResolvedValue(mockResult);
      api.cr.list.mockResolvedValue({ items: [mockCR] });

      const result = await useChangeRequestStore.getState().create('feature', 'auth', 'Add auth');
      expect(api.cr.create).toHaveBeenCalledWith({ cwd: '/project', type: 'feature', name: 'auth', description: 'Add auth' });
      expect(result).toEqual(mockResult);
      expect(api.cr.list).toHaveBeenCalled(); // refresh was called
    });
  });

  describe('start', () => {
    it('calls IPC and refreshes', async () => {
      const mockResult = { cr: { ...mockCR, status: 'running' as const }, worktreePath: '/tmp/wt' };
      api.cr.start.mockResolvedValue(mockResult);
      api.cr.list.mockResolvedValue({ items: [] });

      const result = await useChangeRequestStore.getState().start('feature-auth');
      expect(api.cr.start).toHaveBeenCalledWith({ cwd: '/project', crId: 'feature-auth' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('stop', () => {
    it('calls IPC and refreshes', async () => {
      api.cr.list.mockResolvedValue({ items: [] });

      await useChangeRequestStore.getState().stop('feature-auth');
      expect(api.cr.stop).toHaveBeenCalledWith({ cwd: '/project', crId: 'feature-auth' });
      expect(api.cr.list).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('calls IPC with strategy and refreshes', async () => {
      const mockResult = { cr: { ...mockCR, status: 'approved' as const } };
      api.cr.approve.mockResolvedValue(mockResult);
      api.cr.list.mockResolvedValue({ items: [] });

      await useChangeRequestStore.getState().approve('feature-auth', 'merge');
      expect(api.cr.approve).toHaveBeenCalledWith({ cwd: '/project', crId: 'feature-auth', strategy: 'merge' });
    });
  });

  describe('discard', () => {
    it('calls IPC and refreshes', async () => {
      api.cr.list.mockResolvedValue({ items: [] });

      await useChangeRequestStore.getState().discard('feature-auth');
      expect(api.cr.discard).toHaveBeenCalledWith({ cwd: '/project', crId: 'feature-auth' });
      expect(api.cr.list).toHaveBeenCalled();
    });
  });
});
