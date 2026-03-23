import { env } from 'node:process';

export function detectShell(): string {
  if (process.platform === 'win32') {
    return env.COMSPEC || 'cmd.exe';
  }
  return env.SHELL || '/bin/bash';
}
