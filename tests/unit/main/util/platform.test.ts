import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('getConfigDir', () => {
  it('returns XDG path on Linux', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    vi.stubEnv('XDG_CONFIG_HOME', '/tmp/xdg');
    const { getConfigDir } = await import('../../../../src/main/util/platform');
    expect(getConfigDir()).toBe('/tmp/xdg/aide');
  });

  it('falls back to ~/.config on Linux when XDG is unset', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    vi.stubEnv('XDG_CONFIG_HOME', '');
    const { getConfigDir } = await import('../../../../src/main/util/platform');
    expect(getConfigDir()).toMatch(/\.config\/aide$/);
  });

  it('returns APPDATA path on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    vi.stubEnv('APPDATA', 'C:\\Users\\test\\AppData\\Roaming');
    const { getConfigDir } = await import('../../../../src/main/util/platform');
    expect(getConfigDir()).toBe('C:\\Users\\test\\AppData\\Roaming/aide');
  });

  it('returns Library path on macOS', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const { getConfigDir } = await import('../../../../src/main/util/platform');
    expect(getConfigDir()).toMatch(/Library\/Application Support\/aide$/);
  });
});

describe('getDefaultCwd', () => {
  it('returns cwd when not root', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/home/user/projects');
    const { getDefaultCwd } = await import('../../../../src/main/util/platform');
    expect(getDefaultCwd()).toBe('/home/user/projects');
  });

  it('returns homedir when cwd is root', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/');
    const { getDefaultCwd } = await import('../../../../src/main/util/platform');
    expect(getDefaultCwd()).not.toBe('/');
  });
});
