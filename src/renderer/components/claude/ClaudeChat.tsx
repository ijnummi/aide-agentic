import type { ClaudeMessage } from '../../../shared/types/claude';
import { ToolCallCard } from './ToolCallCard';
import { User, Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ClaudeChatProps {
  messages: ClaudeMessage[];
}

export function ClaudeChat({ messages }: ClaudeChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        No messages yet. Send a prompt to start.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {msg.role === 'user' ? (
              <div className="w-6 h-6 rounded bg-[var(--bg-surface)] flex items-center justify-center">
                <User size={14} className="text-[var(--text-muted)]" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                <Bot size={14} className="text-[var(--accent)]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {msg.blocks.map((block, i) => {
              if (block.type === 'text') {
                return (
                  <div
                    key={i}
                    className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words"
                  >
                    {block.text}
                  </div>
                );
              }
              if (block.type === 'tool_use') {
                return <ToolCallCard key={i} tool={block} />;
              }
              return null;
            })}
            {msg.role === 'assistant' && msg.inputTokens != null && (
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                ↑{formatTokens(msg.inputTokens)} ↓{formatTokens(msg.outputTokens || 0)}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
