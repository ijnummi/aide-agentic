import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let detectShell: () => string;

beforeEach(async () => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('detectShell', () => {
  it('returns SHELL env on non-Windows', async () => {
    vi.stubEnv('SHELL', '/bin/zsh');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    const mod = await import('../../../../src/main/util/shell');
    detectShell = mod.detectShell;
    expect(detectShell()).toBe('/bin/zsh');
  });

  it('falls back to /bin/bash when SHELL is unset on non-Windows', async () => {
    vi.stubEnv('SHELL', '');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    const mod = await import('../../../../src/main/util/shell');
    detectShell = mod.detectShell;
    expect(detectShell()).toBe('/bin/bash');
  });

  it('returns COMSPEC on Windows', async () => {
    vi.stubEnv('COMSPEC', 'C:\\Windows\\System32\\cmd.exe');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    const mod = await import('../../../../src/main/util/shell');
    detectShell = mod.detectShell;
    expect(detectShell()).toBe('C:\\Windows\\System32\\cmd.exe');
  });

  it('falls back to cmd.exe when COMSPEC is unset on Windows', async () => {
    vi.stubEnv('COMSPEC', '');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    const mod = await import('../../../../src/main/util/shell');
    detectShell = mod.detectShell;
    expect(detectShell()).toBe('cmd.exe');
  });
});
