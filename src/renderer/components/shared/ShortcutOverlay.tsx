import { useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { getShortcutsByCategory } from '../../lib/shortcuts';

interface ShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutOverlay({ open, onClose }: ShortcutOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = getShortcutsByCategory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl w-[720px] max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Keyboard size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</span>
        </div>

        {/* Content — two columns */}
        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-x-8 gap-y-4">
          {Array.from(grouped.entries()).map(([category, entries]) => (
            <div key={category}>
              <div className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                {category}
              </div>
              <div className="flex flex-col gap-1">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-1 px-1"
                  >
                    <span style={{ fontSize: 15 }} className="text-[var(--text-primary)]">{entry.label}</span>
                    <Kbd shortcut={entry.shortcut} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          Press <Kbd shortcut="Esc" /> to close
        </div>
      </div>
    </div>
  );
}

function Kbd({ shortcut }: { shortcut: string }) {
  const parts = shortcut.split('+');
  return (
    <span className="flex items-center gap-0.5">
      {parts.map((part, i) => (
        <span key={i}>
          <kbd className="inline-block px-1.5 py-0.5 text-[13px] font-mono rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
            {part}
          </kbd>
          {i < parts.length - 1 && <span className="text-[var(--text-muted)] mx-0.5">+</span>}
        </span>
      ))}
    </span>
  );
}
