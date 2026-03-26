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

    // For regular shells, silently cd to cwd after shell init (rc scripts may
    // override the spawn cwd). We send `cd <path> && printf '\033c'` and
    // buffer all PTY output until the ESC c (RIS) sequence appears, so the
    // renderer never sees the cd command or shell init noise.
    const needsCdInit = request.cwd && request.shell !== 'claude';

    if (needsCdInit) {
      let buffering = true;
      let buffer = '';

      ptyProcess.onData((data) => {
        if (!buffering) {
          callbacks.onData(request.id, data);
          return;
        }
        buffer += data;
        const risIndex = buffer.indexOf('\x1bc');
        if (risIndex !== -1) {
          buffering = false;
          // Forward everything after the RIS (the fresh prompt)
          const after = buffer.slice(risIndex + 2);
          buffer = '';
          if (after) callbacks.onData(request.id, after);
        }
      });

      // Leading space keeps the command out of shell history
      const quoted = request.cwd.includes("'")
        ? `"${request.cwd}"`
        : `'${request.cwd}'`;
      ptyProcess.write(` cd ${quoted} && printf '\\033c'\r`);

      // Safety fallback: stop buffering after 5 s even if RIS wasn't detected
      setTimeout(() => {
        if (buffering) {
          buffering = false;
          if (buffer) {
            callbacks.onData(request.id, buffer);
            buffer = '';
          }
        }
      }, 5_000);
    } else {
      ptyProcess.onData((data) => {
        callbacks.onData(request.id, data);
      });
    }

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
