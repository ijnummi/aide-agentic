import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Terminal, Search, Pencil } from 'lucide-react';
import type { ClaudeToolUseBlock } from '../../../shared/types/claude';

const toolIcons: Record<string, typeof Terminal> = {
  Read: FileText,
  Bash: Terminal,
  Grep: Search,
  Edit: Pencil,
  Write: Pencil,
};

interface ToolCallCardProps {
  tool: ClaudeToolUseBlock;
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = toolIcons[tool.toolName] || Terminal;

  const summary = getToolSummary(tool);

  return (
    <div className="border border-[var(--border)] rounded my-1 overflow-hidden">
      <button
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Icon size={14} className="text-[var(--accent)]" />
        <span className="font-medium text-[var(--text-primary)]">{tool.toolName}</span>
        <span className="text-[var(--text-muted)] truncate flex-1">{summary}</span>
        {tool.isError && (
          <span className="text-[var(--error)] text-xs">failed</span>
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2 text-xs bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <pre className="whitespace-pre-wrap text-[var(--text-secondary)] overflow-x-auto">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
          {tool.result && (
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Result:</span>
              <pre className="whitespace-pre-wrap text-[var(--text-secondary)] mt-1 max-h-40 overflow-y-auto">
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getToolSummary(tool: ClaudeToolUseBlock): string {
  const input = tool.input;
  switch (tool.toolName) {
    case 'Read':
      return String(input.file_path || input.path || '');
    case 'Edit':
    case 'Write':
      return String(input.file_path || input.path || '');
    case 'Bash':
      return String(input.command || '').slice(0, 80);
    case 'Grep':
      return `${input.pattern || ''} ${input.path || ''}`;
    case 'Glob':
      return String(input.pattern || '');
    default:
      return '';
  }
}
