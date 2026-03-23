import type { PRComment } from '../../../shared/types/github';

interface ReviewCommentProps {
  comment: PRComment;
}

export function ReviewComment({ comment }: ReviewCommentProps) {
  const date = new Date(comment.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="px-3 py-2 border-b border-[var(--border)]">
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-1">
        <span className="font-medium text-[var(--text-secondary)]">{comment.author}</span>
        <span>{timeAgo}</span>
        {comment.path && (
          <span className="text-[var(--accent)]">{comment.path}:{comment.line}</span>
        )}
      </div>
      <div className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">
        {comment.body}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
