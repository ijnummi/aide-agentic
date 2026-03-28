import { describe, it, expect } from 'vitest';
import { getShortcutsByCategory, SHORTCUTS } from '../../../../src/renderer/lib/shortcuts';

describe('getShortcutsByCategory', () => {
  it('returns a map with all used categories', () => {
    const map = getShortcutsByCategory();
    expect(map.has('General')).toBe(true);
    expect(map.has('Terminal')).toBe(true);
    expect(map.has('Navigation')).toBe(true);
    expect(map.has('Claude')).toBe(true);
    expect(map.has('Git')).toBe(true);
  });

  it('groups shortcuts correctly', () => {
    const map = getShortcutsByCategory();
    const general = map.get('General')!;
    expect(general.every((s) => s.category === 'General')).toBe(true);
  });

  it('includes all shortcuts across categories', () => {
    const map = getShortcutsByCategory();
    let total = 0;
    for (const entries of map.values()) {
      total += entries.length;
    }
    expect(total).toBe(SHORTCUTS.length);
  });
});
