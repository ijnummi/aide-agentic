import { useState } from 'react';
import { useWorktreeStore } from '../../stores/worktree.store';
import { baseName } from '../../lib/path';

interface CreateWorktreeDialogProps {
  onClose: () => void;
}

export function CreateWorktreeDialog({ onClose }: CreateWorktreeDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const add = useWorktreeStore((s) => s.add);
  const cwd = useWorktreeStore((s) => s.cwd);

  const projectName = baseName(cwd);
  const worktreePath = name.trim() ? `../${projectName}-${name.trim()}` : '';
  const branch = name.trim();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await add(worktreePath, branch, true);
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

        <label className="block text-xs text-[var(--text-muted)] mb-1">Feature name</label>
        <input
          className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs rounded px-2 py-1.5 mb-2 outline-none border border-[var(--border)] focus:border-[var(--accent)]"
          placeholder="my-feature"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        {name.trim() && (
          <div className="text-xs text-[var(--text-muted)] mb-3 space-y-0.5">
            <div>Directory: <span className="text-[var(--text-secondary)]">{worktreePath}</span></div>
            <div>Branch: <span className="text-[var(--text-secondary)]">{branch}</span></div>
          </div>
        )}

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
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
