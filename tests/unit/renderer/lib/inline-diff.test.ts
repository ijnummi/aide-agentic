import { describe, it, expect } from 'vitest';
import { computeInlineDiff } from '../../../../src/renderer/lib/inline-diff';

describe('computeInlineDiff', () => {
  it('returns unchanged segments for identical strings', () => {
    const { oldSegments, newSegments } = computeInlineDiff('hello', 'hello');
    expect(oldSegments).toEqual([{ text: 'hello', changed: false }]);
    expect(newSegments).toEqual([{ text: 'hello', changed: false }]);
  });

  it('finds common prefix and suffix', () => {
    const { oldSegments, newSegments } = computeInlineDiff(
      'const x = 1;',
      'const x = 2;',
    );
    expect(oldSegments).toEqual([
      { text: 'const x = ', changed: false },
      { text: '1', changed: true },
      { text: ';', changed: false },
    ]);
    expect(newSegments).toEqual([
      { text: 'const x = ', changed: false },
      { text: '2', changed: true },
      { text: ';', changed: false },
    ]);
  });

  it('handles completely different strings', () => {
    const { oldSegments, newSegments } = computeInlineDiff('abc', 'xyz');
    expect(oldSegments).toEqual([{ text: 'abc', changed: true }]);
    expect(newSegments).toEqual([{ text: 'xyz', changed: true }]);
  });

  it('handles empty old string', () => {
    const { oldSegments, newSegments } = computeInlineDiff('', 'new');
    expect(oldSegments).toEqual([]);
    expect(newSegments).toEqual([{ text: 'new', changed: true }]);
  });

  it('handles empty new string', () => {
    const { oldSegments, newSegments } = computeInlineDiff('old', '');
    expect(oldSegments).toEqual([{ text: 'old', changed: true }]);
    expect(newSegments).toEqual([]);
  });

  it('handles both empty strings', () => {
    const { oldSegments, newSegments } = computeInlineDiff('', '');
    expect(oldSegments).toEqual([{ text: '', changed: false }]);
    expect(newSegments).toEqual([{ text: '', changed: false }]);
  });

  it('handles change at beginning only', () => {
    const { oldSegments, newSegments } = computeInlineDiff('aaa_end', 'bbb_end');
    expect(oldSegments).toEqual([
      { text: 'aaa', changed: true },
      { text: '_end', changed: false },
    ]);
    expect(newSegments).toEqual([
      { text: 'bbb', changed: true },
      { text: '_end', changed: false },
    ]);
  });

  it('handles change at end only', () => {
    const { oldSegments, newSegments } = computeInlineDiff('start_aaa', 'start_bbb');
    expect(oldSegments).toEqual([
      { text: 'start_', changed: false },
      { text: 'aaa', changed: true },
    ]);
    expect(newSegments).toEqual([
      { text: 'start_', changed: false },
      { text: 'bbb', changed: true },
    ]);
  });
});
