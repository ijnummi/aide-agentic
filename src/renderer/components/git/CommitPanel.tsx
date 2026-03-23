import { useState, type KeyboardEvent } from 'react';
import { useGitStore } from '../../stores/git.store';

export function CommitPanel() {
  const { staged, commit } = useGitStore();
  const [message, setMessage] = useState('');

  const handleCommit = async () => {
    const msg = message.trim();
    if (!msg || staged.length === 0) return;
    await commit(msg);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 px-1 mt-2">
      <textarea
        className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 resize-none outline-none border border-[var(--border)] focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Commit message..."
      />
      <button
        className="w-full py-1 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 transition-opacity"
        onClick={handleCommit}
        disabled={!message.trim() || staged.length === 0}
      >
        Commit ({staged.length} staged)
      </button>
    </div>
  );
}
