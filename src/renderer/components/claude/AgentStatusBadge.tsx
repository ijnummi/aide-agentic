import type { ClaudeSessionStatus } from '../../../shared/types/claude';

const statusConfig: Record<ClaudeSessionStatus, { label: string; color: string }> = {
  starting: { label: 'Starting', color: 'var(--warning)' },
  running: { label: 'Running', color: 'var(--accent)' },
  waiting: { label: 'Ready', color: 'var(--success)' },
  stopped: { label: 'Stopped', color: 'var(--text-muted)' },
  error: { label: 'Error', color: 'var(--error)' },
};

interface AgentStatusBadgeProps {
  status: ClaudeSessionStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span style={{ color: config.color }}>{config.label}</span>
    </span>
  );
}
