import { spawn, type ChildProcess } from 'node:child_process';
import * as readline from 'node:readline';
import type {
  ClaudeStartRequest,
  ClaudeStreamEvent,
  ClaudeStatusEvent,
  ClaudeRawEvent,
} from '../../shared/types/claude';

interface SessionEntry {
  process: ChildProcess;
  cwd: string;
}

interface ClaudeCallbacks {
  onEvent: (event: ClaudeStreamEvent) => void;
  onStatus: (event: ClaudeStatusEvent) => void;
}

export class ClaudeService {
  private sessions = new Map<string, SessionEntry>();

  start(request: ClaudeStartRequest, callbacks: ClaudeCallbacks): void {
    // Kill existing process for this session if running
    this.stop(request.sessionId);

    const args: string[] = [];

    if (request.prompt) {
      args.push('-p', request.prompt);
    }

    args.push('--output-format', 'stream-json');
    args.push('--verbose');

    if (request.model) {
      args.push('--model', request.model);
    }

    if (request.resume) {
      args.push('--resume', request.resume);
    }

    callbacks.onStatus({
      sessionId: request.sessionId,
      status: 'running',
    });

    const proc = spawn('claude', args, {
      cwd: request.cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.sessions.set(request.sessionId, {
      process: proc,
      cwd: request.cwd,
    });

    // Parse stdout line by line as NDJSON
    if (proc.stdout) {
      const rl = readline.createInterface({ input: proc.stdout });
      rl.on('line', (line) => {
        if (!line.trim()) return;
        try {
          const event = JSON.parse(line) as ClaudeRawEvent;
          callbacks.onEvent({
            sessionId: request.sessionId,
            event,
          });
        } catch {
          // Non-JSON output, ignore
        }
      });
    }

    // Capture stderr for errors
    if (proc.stderr) {
      const rl = readline.createInterface({ input: proc.stderr });
      rl.on('line', (line) => {
        if (line.trim()) {
          callbacks.onEvent({
            sessionId: request.sessionId,
            event: { type: 'system', subtype: 'stderr', message: line },
          });
        }
      });
    }

    proc.on('error', (err) => {
      callbacks.onStatus({
        sessionId: request.sessionId,
        status: 'error',
        error: err.message,
      });
      this.sessions.delete(request.sessionId);
    });

    proc.on('exit', (code) => {
      this.sessions.delete(request.sessionId);
      // Don't override status — the renderer handles status via 'result' events
    });
  }

  stop(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry && entry.process && !entry.process.killed) {
      entry.process.kill();
    }
    this.sessions.delete(sessionId);
  }

  dispose(): void {
    for (const [id] of this.sessions) {
      this.stop(id);
    }
  }
}
