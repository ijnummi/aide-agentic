import { watch, type FSWatcher } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export interface ClaudeSessionStats {
  sessionId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  messageCount: number;
}

/**
 * Watches a Claude Code session JSONL file and extracts stats.
 */
export class ClaudeWatcherService {
  private watchers = new Map<string, FSWatcher>();
  private offsets = new Map<string, number>();

  /** Get the JSONL path for a Claude session in a given project */
  getSessionPath(projectPath: string, sessionId: string): string {
    const encoded = projectPath.replace(/\//g, '-');
    return path.join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);
  }

  /** Start watching a session file. Calls `onStats` whenever new data arrives. */
  watch(projectPath: string, sessionId: string, onStats: (stats: ClaudeSessionStats) => void): void {
    const filePath = this.getSessionPath(projectPath, sessionId);
    this.unwatch(sessionId);
    this.offsets.set(sessionId, 0);

    // Initial read
    this.readAndParse(filePath, sessionId, onStats);

    try {
      const watcher = watch(filePath, () => {
        this.readAndParse(filePath, sessionId, onStats);
      });
      this.watchers.set(sessionId, watcher);
    } catch {
      // File might not exist yet — will be created when Claude starts
    }
  }

  unwatch(sessionId: string): void {
    const watcher = this.watchers.get(sessionId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(sessionId);
    }
    this.offsets.delete(sessionId);
  }

  dispose(): void {
    for (const [id] of this.watchers) {
      this.unwatch(id);
    }
  }

  private async readAndParse(
    filePath: string,
    sessionId: string,
    onStats: (stats: ClaudeSessionStats) => void,
  ): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const stats: ClaudeSessionStats = {
        sessionId,
        model: '',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        messageCount: 0,
      };

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'assistant' && entry.message) {
            stats.messageCount++;
            if (entry.message.model) stats.model = entry.message.model;
            const usage = entry.message.usage;
            if (usage) {
              stats.inputTokens += usage.input_tokens || 0;
              stats.outputTokens += usage.output_tokens || 0;
              stats.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
              stats.cacheReadTokens += usage.cache_read_input_tokens || 0;
            }
          }
        } catch {
          // skip malformed lines
        }
      }

      onStats(stats);
    } catch {
      // File doesn't exist yet
    }
  }
}
