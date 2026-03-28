import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, getSettings } from '../../../../src/renderer/stores/settings.store';
import { DEFAULT_SETTINGS } from '../../../../src/shared/settings';

function resetStore() {
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS });
}

describe('settings store', () => {
  beforeEach(resetStore);

  describe('update', () => {
    it('deep merges partial settings', () => {
      useSettingsStore.getState().update({ font: { uiSize: 20 } });
      const s = useSettingsStore.getState().settings;
      expect(s.font.uiSize).toBe(20);
      // siblings preserved
      expect(s.font.family).toBe(DEFAULT_SETTINGS.font.family);
      expect(s.font.terminalSize).toBe(DEFAULT_SETTINGS.font.terminalSize);
    });

    it('does not clobber unrelated sections', () => {
      useSettingsStore.getState().update({ layout: { tabBarHeight: 40 } });
      const s = useSettingsStore.getState().settings;
      expect(s.layout.tabBarHeight).toBe(40);
      expect(s.terminal.scrollback).toBe(DEFAULT_SETTINGS.terminal.scrollback);
    });

    it('replaces arrays entirely', () => {
      useSettingsStore.getState().update({ docs: { instructionFiles: ['CUSTOM.md'] } });
      const s = useSettingsStore.getState().settings;
      expect(s.docs.instructionFiles).toEqual(['CUSTOM.md']);
    });

    it('can update nested theme colors', () => {
      useSettingsStore.getState().update({ themes: { dark: { accent: '#ff0000' } } });
      const s = useSettingsStore.getState().settings;
      expect(s.themes.dark.accent).toBe('#ff0000');
      expect(s.themes.dark.bgPrimary).toBe(DEFAULT_SETTINGS.themes.dark.bgPrimary);
    });
  });

  describe('getSettings', () => {
    it('returns current settings outside React', () => {
      expect(getSettings()).toEqual(DEFAULT_SETTINGS);
      useSettingsStore.getState().update({ font: { uiSize: 14 } });
      expect(getSettings().font.uiSize).toBe(14);
    });
  });
});
