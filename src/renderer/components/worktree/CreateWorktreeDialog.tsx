import { useState } from 'react';
import { useWorktreeStore } from '../../stores/worktree.store';

interface CreateWorktreeDialogProps {
  onClose: () => void;
}

export function CreateWorktreeDialog({ onClose }: CreateWorktreeDialogProps) {
  const [path, setPath] = useState('');
  const [branch, setBranch] = useState('');
  const [createBranch, setCreateBranch] = useState(true);
  const [error, setError] = useState('');
  const add = useWorktreeStore((s) => s.add);

  const handleCreate = async () => {
    if (!path.trim() || !branch.trim()) return;
    setError('');
    try {
      await add(path.trim(), branch.trim(), createBranch);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create worktree');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl w-80 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">New Worktree</h3>

        <label className="block text-xs text-[var(--text-muted)] mb-1">Path</label>
        <input
          className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 mb-2 outline-none border border-[var(--border)] focus:border-[var(--accent)]"
          placeholder="../my-feature"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          autoFocus
        />

        <label className="block text-xs text-[var(--text-muted)] mb-1">Branch</label>
        <input
          className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 mb-2 outline-none border border-[var(--border)] focus:border-[var(--accent)]"
          placeholder="feature/my-branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={createBranch}
            onChange={(e) => setCreateBranch(e.target.checked)}
            className="rounded"
          />
          Create new branch
        </label>

        {error && (
          <div className="text-xs text-[var(--error)] mb-2">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-xs rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40"
            onClick={handleCreate}
            disabled={!path.trim() || !branch.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
