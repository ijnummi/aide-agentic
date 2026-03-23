import { homedir } from 'node:os';
import path from 'node:path';

export function getConfigDir(): string {
  if (process.platform === 'darwin') {
    return path.join(homedir(), 'Library', 'Application Support', 'aide');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || homedir(), 'aide');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(homedir(), '.config'), 'aide');
}

export function getDefaultCwd(): string {
  return process.cwd() !== '/' ? process.cwd() : homedir();
}
