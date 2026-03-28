import { describe, it, expect, beforeEach } from 'vitest';
import { useDocPreviewStore } from '../../../../src/renderer/stores/docpreview.store';

function resetStore() {
  useDocPreviewStore.setState({ previews: new Map() });
}

describe('docpreview store', () => {
  beforeEach(resetStore);

  describe('get', () => {
    it('returns false for unknown tab', () => {
      expect(useDocPreviewStore.getState().get('unknown')).toBe(false);
    });
  });

  describe('set', () => {
    it('sets preview mode for tab', () => {
      useDocPreviewStore.getState().set('tab-1', true);
      expect(useDocPreviewStore.getState().get('tab-1')).toBe(true);
    });
  });

  describe('toggle', () => {
    it('toggles from false to true', () => {
      useDocPreviewStore.getState().toggle('tab-1');
      expect(useDocPreviewStore.getState().get('tab-1')).toBe(true);
    });

    it('toggles from true to false', () => {
      useDocPreviewStore.getState().set('tab-1', true);
      useDocPreviewStore.getState().toggle('tab-1');
      expect(useDocPreviewStore.getState().get('tab-1')).toBe(false);
    });
  });
});
