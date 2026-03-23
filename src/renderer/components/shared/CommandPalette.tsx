import { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ commands, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%]" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
          <Search size={14} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left ${
                i === selectedIndex
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => {
                cmd.action();
                onClose();
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {cmd.shortcut}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
