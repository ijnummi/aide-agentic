import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import type { PtyCreateRequest } from '../../shared/types/terminal';
import { detectShell } from '../util/shell';

interface PtyCallbacks {
  onData: (id: string, data: string) => void;
  onExit: (id: string, exitCode: number) => void;
}

export class PtyService {
  private ptys = new Map<string, IPty>();

  create(request: PtyCreateRequest, callbacks: PtyCallbacks): { pid: number } {
    const shell = request.shell || detectShell();

    const ptyProcess = pty.spawn(shell, request.args || [], {
      name: 'xterm-256color',
      cols: request.cols,
      rows: request.rows,
      cwd: request.cwd,
      env: { ...process.env, ...request.env } as Record<string, string>,
    });

    ptyProcess.onData((data) => {
      callbacks.onData(request.id, data);
    });

    ptyProcess.onExit(({ exitCode }) => {
      callbacks.onExit(request.id, exitCode);
      this.ptys.delete(request.id);
    });

    this.ptys.set(request.id, ptyProcess);
    return { pid: ptyProcess.pid };
  }

  write(id: string, data: string): void {
    const p = this.ptys.get(id);
    if (p) {
      p.write(data);
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const p = this.ptys.get(id);
    if (p) {
      p.resize(cols, rows);
    }
  }

  kill(id: string): void {
    const p = this.ptys.get(id);
    if (p) {
      p.kill();
      this.ptys.delete(id);
    }
  }

  dispose(): void {
    for (const [id, p] of this.ptys) {
      p.kill();
      this.ptys.delete(id);
    }
  }
}
