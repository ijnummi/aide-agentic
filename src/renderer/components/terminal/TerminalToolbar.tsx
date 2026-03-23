import { Columns2, Rows2, X } from 'lucide-react';
import { IconButton } from '../shared/IconButton';

interface TerminalToolbarProps {
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onKill: () => void;
}

export function TerminalToolbar({ onSplitHorizontal, onSplitVertical, onKill }: TerminalToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1">
      <IconButton icon={Columns2} size={14} title="Split Right" onClick={onSplitHorizontal} />
      <IconButton icon={Rows2} size={14} title="Split Down" onClick={onSplitVertical} />
      <IconButton icon={X} size={14} title="Kill Terminal" onClick={onKill} />
    </div>
  );
}
