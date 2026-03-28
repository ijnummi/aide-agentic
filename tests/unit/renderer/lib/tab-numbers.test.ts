import { describe, it, expect } from 'vitest';
import {
  getTabNumbers,
  findTabByNumber,
  ALL_CHANGES_TAB_ID,
  RESERVED_NUMBER,
} from '../../../../src/renderer/lib/tab-numbers';
import type { TabItem } from '../../../../src/shared/types/layout';

function tab(id: string): TabItem {
  return { id, type: 'terminal', title: id };
}

describe('getTabNumbers', () => {
  it('assigns sequential numbers starting at 1', () => {
    const tabs = [tab('a'), tab('b'), tab('c')];
    const nums = getTabNumbers(tabs);
    expect(nums.get('a')).toBe(1);
    expect(nums.get('b')).toBe(2);
    expect(nums.get('c')).toBe(3);
  });

  it('skips reserved number 4 for regular tabs', () => {
    const tabs = [tab('a'), tab('b'), tab('c'), tab('d'), tab('e')];
    const nums = getTabNumbers(tabs);
    expect(nums.get('a')).toBe(1);
    expect(nums.get('b')).toBe(2);
    expect(nums.get('c')).toBe(3);
    expect(nums.get('d')).toBe(5);
    expect(nums.get('e')).toBe(6);
  });

  it('assigns reserved number to All Changes tab', () => {
    const tabs = [tab('a'), tab(ALL_CHANGES_TAB_ID), tab('b')];
    const nums = getTabNumbers(tabs);
    expect(nums.get(ALL_CHANGES_TAB_ID)).toBe(RESERVED_NUMBER);
    expect(nums.get('a')).toBe(1);
    expect(nums.get('b')).toBe(2);
  });

  it('returns empty map for no tabs', () => {
    expect(getTabNumbers([])).toEqual(new Map());
  });
});

describe('findTabByNumber', () => {
  it('finds tab by display number', () => {
    const tabs = [tab('a'), tab('b'), tab('c')];
    expect(findTabByNumber(tabs, 2)).toBe('b');
  });

  it('finds All Changes tab by reserved number', () => {
    const tabs = [tab('a'), tab(ALL_CHANGES_TAB_ID)];
    expect(findTabByNumber(tabs, RESERVED_NUMBER)).toBe(ALL_CHANGES_TAB_ID);
  });

  it('returns null for non-existent number', () => {
    const tabs = [tab('a')];
    expect(findTabByNumber(tabs, 99)).toBeNull();
  });
});
