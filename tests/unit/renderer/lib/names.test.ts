import { describe, it, expect, vi, beforeEach } from 'vitest';

// Re-import fresh module for each test to reset counters
let terminalName: () => string;
let claudeName: () => string;
let diffName: (file: string) => string;
let prName: (number: number) => string;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../../../src/renderer/lib/names');
  terminalName = mod.terminalName;
  claudeName = mod.claudeName;
  diffName = mod.diffName;
  prName = mod.prName;
});

describe('terminalName', () => {
  it('returns names from the list sequentially', () => {
    const first = terminalName();
    const second = terminalName();
    expect(first).toBe('Timber');
    expect(second).toBe('Time');
  });

  it('cycles after exhausting the list', () => {
    for (let i = 0; i < 20; i++) terminalName();
    expect(terminalName()).toBe('Timber');
  });
});

describe('claudeName', () => {
  it('returns names from the list sequentially', () => {
    expect(claudeName()).toBe('Crest');
    expect(claudeName()).toBe('Crisp');
  });
});

describe('diffName', () => {
  it('formats as D:filename', () => {
    expect(diffName('src/components/App.tsx')).toBe('D:App.tsx');
  });
});

describe('prName', () => {
  it('formats as PR:#number', () => {
    expect(prName(42)).toBe('PR:#42');
  });
});
