import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  size?: number;
  title?: string;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

export function IconButton({
  icon: Icon,
  size = 18,
  title,
  active,
  className = '',
  onClick,
}: IconButtonProps) {
  return (
    <button
      className={`flex items-center justify-center p-1.5 rounded transition-colors ${
        active
          ? 'text-[var(--accent)] bg-[var(--bg-surface)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
      } ${className}`}
      onClick={onClick}
      title={title}
    >
      <Icon size={size} />
    </button>
  );
}
