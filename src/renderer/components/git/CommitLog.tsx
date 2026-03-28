import { GitCommitHorizontal } from 'lucide-react';
import { useGitStore } from '../../stores/git.store';
import type { GitLogEntry } from '../../../shared/types/git';

interface CommitLogProps {
  onSelectCommit?: (entry: GitLogEntry) => void;
}

export function CommitLog({ onSelectCommit }: CommitLogProps) {
  const log = useGitStore((s) => s.log);

  if (log.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1 px-1 py-0.5 text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
        Commits ({log.length})
      </div>
      {log.map((entry) => (
        <div
          key={entry.hash}
          className="flex items-start gap-2 px-2 py-1 rounded cursor-pointer hover:bg-[var(--bg-surface)] group"
          onClick={() => onSelectCommit?.(entry)}
          title={commitTooltip(entry)}
        >
          <GitCommitHorizontal size={14} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs truncate text-[var(--text-primary)]">{entry.message}</span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {entry.shortHash} &middot; {formatRelativeDate(entry.date)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function commitTooltip(entry: GitLogEntry): string {
  const lines = [entry.message, '', `${entry.hash}`, `${entry.author} · ${entry.date}`];
  if (entry.filesChanged != null) {
    const parts = [`${entry.filesChanged} file${entry.filesChanged !== 1 ? 's' : ''} changed`];
    if (entry.additions) parts.push(`+${entry.additions}`);
    if (entry.deletions) parts.push(`-${entry.deletions}`);
    lines.push(parts.join(', '));
  }
  return lines.join('\n');
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
