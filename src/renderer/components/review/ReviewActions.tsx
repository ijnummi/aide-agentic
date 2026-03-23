import { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { useGitHubStore } from '../../stores/github.store';

interface ReviewActionsProps {
  cwd: string;
  prNumber: number;
}

export function ReviewActions({ cwd, prNumber }: ReviewActionsProps) {
  const submitReview = useGitHubStore((s) => s.submitReview);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT') => {
    setIsSubmitting(true);
    try {
      await submitReview(cwd, prNumber, event, body);
      setBody('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 resize-none outline-none border border-[var(--border)] focus:border-[var(--accent)]"
        rows={2}
        placeholder="Review comment (optional for approve)..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex gap-1.5">
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--success)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40"
          onClick={() => handleSubmit('APPROVE')}
          disabled={isSubmitting}
        >
          <Check size={12} />
          Approve
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--error)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40"
          onClick={() => handleSubmit('REQUEST_CHANGES')}
          disabled={isSubmitting || !body.trim()}
        >
          <X size={12} />
          Request Changes
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] disabled:opacity-40"
          onClick={() => handleSubmit('COMMENT')}
          disabled={isSubmitting || !body.trim()}
        >
          <MessageSquare size={12} />
          Comment
        </button>
      </div>
    </div>
  );
}
