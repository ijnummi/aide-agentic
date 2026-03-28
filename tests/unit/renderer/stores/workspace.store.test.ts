import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../../../../src/renderer/stores/workspace.store';

function resetStore() {
  useWorkspaceStore.setState({ projectPath: '', projectName: '' });
}

describe('workspace store', () => {
  beforeEach(resetStore);

  describe('setProjectPath', () => {
    it('sets path and derives name', () => {
      useWorkspaceStore.getState().setProjectPath('/home/user/projects/aide');
      const { projectPath, projectName } = useWorkspaceStore.getState();
      expect(projectPath).toBe('/home/user/projects/aide');
      expect(projectName).toBe('aide');
    });

    it('handles single segment path', () => {
      useWorkspaceStore.getState().setProjectPath('myproject');
      expect(useWorkspaceStore.getState().projectName).toBe('myproject');
    });
  });
});
