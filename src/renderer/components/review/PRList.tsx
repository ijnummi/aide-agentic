import { useEffect, useState } from 'react';
import { GitPullRequest, RefreshCw, Key } from 'lucide-react';
import { useGitHubStore } from '../../stores/github.store';
import { IconButton } from '../shared/IconButton';
import type { PullRequest } from '../../../shared/types/github';

interface PRListProps {
  cwd: string;
  onSelectPR: (pr: PullRequest) => void;
}

export function PRList({ cwd, onSelectPR }: PRListProps) {
  const { isAuthenticated, prs, isLoading, error, authenticate, loadPRs } = useGitHubStore();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (isAuthenticated && cwd) {
      loadPRs(cwd);
    }
  }, [isAuthenticated, cwd, loadPRs]);

  if (!isAuthenticated) {
    return (
      <div className="p-2 flex flex-col gap-2">
        <div className="text-xs text-[var(--text-muted)]">
          Enter a GitHub personal access token to view PRs.
        </div>
        <input
          type="password"
          className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 outline-none border border-[var(--border)] focus:border-[var(--accent)]"
          placeholder="ghp_..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && token.trim()) authenticate(token.trim());
          }}
        />
        <button
          className="flex items-center justify-center gap-1 w-full py-1 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40"
          onClick={() => authenticate(token.trim())}
          disabled={!token.trim()}
        >
          <Key size={12} />
          Authenticate
        </button>
        {error && <div className="text-xs text-[var(--error)]">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-[var(--text-muted)]">
          {prs.length} PR{prs.length !== 1 ? 's' : ''}
        </span>
        <IconButton
          icon={RefreshCw}
          size={12}
          title="Refresh"
          onClick={() => loadPRs(cwd)}
          className={isLoading ? 'animate-spin' : ''}
        />
      </div>

      {error && <div className="px-2 text-xs text-[var(--error)]">{error}</div>}

      {prs.map((pr) => (
        <button
          key={pr.number}
          className="flex items-start gap-2 px-2 py-1.5 text-left hover:bg-[var(--bg-surface)] rounded"
          onClick={() => onSelectPR(pr)}
        >
          <GitPullRequest
            size={14}
            className={`flex-shrink-0 mt-0.5 ${
              pr.state === 'open' ? 'text-[var(--success)]' : pr.state === 'merged' ? 'text-[var(--accent)]' : 'text-[var(--error)]'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--text-primary)] truncate">{pr.title}</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              #{pr.number} by {pr.author} · {pr.headBranch}
              {pr.draft && ' · draft'}
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
            <span className="text-[var(--success)]">+{pr.additions}</span>{' '}
            <span className="text-[var(--error)]">-{pr.deletions}</span>
          </span>
        </button>
      ))}

      {prs.length === 0 && !isLoading && (
        <div className="px-2 text-xs text-[var(--text-muted)]">No open PRs</div>
      )}
    </div>
  );
}
