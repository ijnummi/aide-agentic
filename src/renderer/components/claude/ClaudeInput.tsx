import { useState, useCallback, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';

interface ClaudeInputProps {
  onSend: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ClaudeInput({ onSend, disabled, placeholder }: ClaudeInputProps) {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const prompt = value.trim();
    if (!prompt || disabled) return;
    onSend(prompt);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <textarea
        className="flex-1 bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded px-3 py-2 resize-none outline-none border border-[var(--border)] focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Send a message...'}
        disabled={disabled}
      />
      <button
        className="flex items-center justify-center w-8 h-8 rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 transition-opacity"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        title="Send (Enter)"
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
}
