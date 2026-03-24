import { useState, useCallback, useRef, useImperativeHandle, forwardRef, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { getSettings } from '../../stores/settings.store';

export interface ClaudeInputHandle {
  focus: () => void;
}

interface ClaudeInputProps {
  onSend: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ClaudeInput = forwardRef<ClaudeInputHandle, ClaudeInputProps>(function ClaudeInput({ onSend, disabled, placeholder }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const prompt = value.trim();
    if (!prompt || disabled) return;
    onSend(prompt);
    setValue('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        // Ctrl+Enter or Shift+Enter: always newline (default behavior)
        if (e.ctrlKey || e.shiftKey) return;

        // Plain Enter: send if last line is empty (double-enter to send)
        const lines = value.split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.trim() === '' && value.trim().length > 0) {
          e.preventDefault();
          handleSend();
        }
        // Otherwise: let default behavior add a newline
      }
    },
    [handleSend, value],
  );

  const s = getSettings();

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <textarea
        ref={textareaRef}
        className="flex-1 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded px-3 py-2 resize-none outline-none border border-[var(--border)] focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
        style={{
          fontFamily: s.font.family,
          fontSize: s.font.terminalSize,
          fontWeight: s.font.terminalWeight,
        }}
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Send a message... (double Enter to send)'}
        disabled={disabled}
      />
      <button
        className="flex items-center justify-center w-8 h-8 rounded bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 transition-opacity"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        title="Send (double Enter)"
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
});
