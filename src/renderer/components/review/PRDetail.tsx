import { useState } from 'react';
import { GitPullRequest, MessageSquare } from 'lucide-react';
import { useGitHubStore } from '../../stores/github.store';
import { DiffViewer } from './DiffViewer';
import { ReviewActions } from './ReviewActions';
import { ReviewComment } from './ReviewComment';

interface PRDetailProps {
  cwd: string;
}

export function PRDetail({ cwd }: PRDetailProps) {
  const { activePR, activePRDiff, addComment } = useGitHubStore();
  const [commentText, setCommentText] = useState('');

  if (!activePR) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        Select a PR to view
      </div>
    );
  }

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    await addComment(cwd, activePR.number, text);
    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <GitPullRequest
            size={16}
            className={
              activePR.state === 'open' ? 'text-[var(--success)]' : activePR.state === 'merged' ? 'text-[var(--accent)]' : 'text-[var(--error)]'
            }
          />
          <span className="text-sm font-medium text-[var(--text-primary)]">{activePR.title}</span>
          <span className="text-xs text-[var(--text-muted)]">#{activePR.number}</span>
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {activePR.author} wants to merge {activePR.headBranch} into {activePR.baseBranch}
          {' · '}
          <span className="text-[var(--success)]">+{activePR.additions}</span>{' '}
          <span className="text-[var(--error)]">-{activePR.deletions}</span>
        </div>
      </div>

      {/* Body + Diff + Comments */}
      <div className="flex-1 overflow-y-auto">
        {activePR.body && (
          <div className="px-3 py-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap border-b border-[var(--border)]">
            {activePR.body}
          </div>
        )}

        {/* Review actions */}
        <div className="px-3 py-2 border-b border-[var(--border)]">
          <ReviewActions cwd={cwd} prNumber={activePR.number} />
        </div>

        {/* Diff */}
        {activePRDiff.length > 0 && (
          <DiffViewer files={activePRDiff} />
        )}

        {/* Comments */}
        {activePR.comments.length > 0 && (
          <div className="border-t border-[var(--border)]">
            <div className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-muted)]">
              <MessageSquare size={12} />
              {activePR.comments.length} comment{activePR.comments.length !== 1 ? 's' : ''}
            </div>
            {activePR.comments.map((c) => (
              <ReviewComment key={c.id} comment={c} />
            ))}
          </div>
        )}

        {/* Add comment */}
        <div className="p-3 border-t border-[var(--border)]">
          <textarea
            className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 resize-none outline-none border border-[var(--border)] focus:border-[var(--accent)]"
            rows={2}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            className="mt-1 px-3 py-1 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40"
            onClick={handleComment}
            disabled={!commentText.trim()}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
