import { useState } from 'react';
import { X } from 'lucide-react';
import type { CRType } from '../../../shared/types/change-request';

interface CreateCRDialogProps {
  onClose: () => void;
  onCreate: (type: CRType, name: string, description: string) => void;
}

export function CreateCRDialog({ onClose, onCreate }: CreateCRDialogProps) {
  const [type, setType] = useState<CRType>('feature');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  // Sanitize name for git branch: lowercase, hyphens only, no leading/trailing hyphens
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
  const crId = sanitized ? `${type}-${sanitized}` : '';
  const valid = sanitized.length > 0 && description.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      onCreate(type, sanitized, description.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        className="w-96 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-semibold text-[var(--text-primary)]">New Change Request</span>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['feature', 'bug'] as CRType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  type === t
                    ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setType(t)}
              >
                {t === 'feature' ? 'Feature' : 'Bug Fix'}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
            <input
              className="w-full px-3 py-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="e.g. login-flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {crId && (
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                Branch: <span className="text-[var(--accent)]">{crId}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              className="w-full px-3 py-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
              rows={4}
              placeholder="Describe what needs to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid || busy}
            className="px-3 py-1.5 rounded text-sm bg-[var(--accent)] text-[var(--bg-primary)] disabled:opacity-30"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
