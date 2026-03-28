import { describe, it, expect } from 'vitest';
import { baseName } from '../../../../src/renderer/lib/path';

describe('baseName', () => {
  it('extracts filename from path', () => {
    expect(baseName('src/lib/utils.ts')).toBe('utils.ts');
  });

  it('returns the string if no slash', () => {
    expect(baseName('file.ts')).toBe('file.ts');
  });

  it('handles trailing slash — pop returns empty, falls back to full path', () => {
    expect(baseName('src/lib/')).toBe('src/lib/');
  });

  it('handles empty string', () => {
    expect(baseName('')).toBe('');
  });

  it('handles deeply nested path', () => {
    expect(baseName('a/b/c/d/e.txt')).toBe('e.txt');
  });
});
