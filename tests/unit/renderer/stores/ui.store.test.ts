import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../../src/renderer/stores/ui.store';
import { DEFAULT_SETTINGS } from '../../../../src/shared/settings';

function resetStore() {
  useUIStore.setState({
    sidebarVisible: true,
    sidebarWidth: DEFAULT_SETTINGS.layout.sidebarDefaultWidth,
    activeSidebarPanel: 'home',
    theme: 'dark',
    zoomLevel: 100,
    visibleDiffFile: '',
  });
}

describe('ui store', () => {
  beforeEach(resetStore);

  describe('toggleSidebar', () => {
    it('toggles visibility', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarVisible).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });
  });

  describe('setSidebarPanel', () => {
    it('sets panel and opens sidebar', () => {
      useUIStore.setState({ sidebarVisible: false });
      useUIStore.getState().setSidebarPanel('git');
      expect(useUIStore.getState().activeSidebarPanel).toBe('git');
      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });

    it('hides sidebar when selecting the already-active panel', () => {
      useUIStore.getState().setSidebarPanel('git');
      expect(useUIStore.getState().sidebarVisible).toBe(true);
      useUIStore.getState().setSidebarPanel('git');
      expect(useUIStore.getState().sidebarVisible).toBe(false);
    });

    it('switches panel without toggling if different panel', () => {
      useUIStore.getState().setSidebarPanel('git');
      useUIStore.getState().setSidebarPanel('docs');
      expect(useUIStore.getState().activeSidebarPanel).toBe('docs');
      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });
  });

  describe('setSidebarWidth', () => {
    it('clamps to minimum', () => {
      useUIStore.getState().setSidebarWidth(10);
      expect(useUIStore.getState().sidebarWidth).toBe(DEFAULT_SETTINGS.layout.sidebarMinWidth);
    });

    it('clamps to maximum', () => {
      useUIStore.getState().setSidebarWidth(9999);
      expect(useUIStore.getState().sidebarWidth).toBe(DEFAULT_SETTINGS.layout.sidebarMaxWidth);
    });

    it('accepts value within range', () => {
      useUIStore.getState().setSidebarWidth(200);
      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });
  });

  describe('zoom', () => {
    it('zoomIn increases by 10', () => {
      useUIStore.getState().zoomIn();
      expect(useUIStore.getState().zoomLevel).toBe(110);
    });

    it('zoomOut decreases by 10', () => {
      useUIStore.getState().zoomOut();
      expect(useUIStore.getState().zoomLevel).toBe(90);
    });

    it('zoomIn caps at 200', () => {
      useUIStore.setState({ zoomLevel: 200 });
      useUIStore.getState().zoomIn();
      expect(useUIStore.getState().zoomLevel).toBe(200);
    });

    it('zoomOut caps at 50', () => {
      useUIStore.setState({ zoomLevel: 50 });
      useUIStore.getState().zoomOut();
      expect(useUIStore.getState().zoomLevel).toBe(50);
    });

    it('resetZoom returns to 100', () => {
      useUIStore.setState({ zoomLevel: 150 });
      useUIStore.getState().resetZoom();
      expect(useUIStore.getState().zoomLevel).toBe(100);
    });
  });

  describe('setTheme', () => {
    it('changes theme', () => {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });
  });
});
