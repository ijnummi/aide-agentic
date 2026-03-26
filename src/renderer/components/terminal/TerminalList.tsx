import { useMemo } from 'react';
import { Terminal, Plus, X } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminal.store';
import { useLayoutStore } from '../../stores/layout.store';
import { disposeTerminal } from '../../hooks/useTerminal';
import { IconButton } from '../shared/IconButton';
import type { TabItem } from '../../../shared/types/layout';

interface TerminalListProps {
  cwd: string;
}

export function TerminalList({ cwd }: TerminalListProps) {
  const terminals = useTerminalStore((s) => s.terminals);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const killTerminal = useTerminalStore((s) => s.killTerminal);
  const addTab = useLayoutStore((s) => s.addTab);
  const focusOrAddTab = useLayoutStore((s) => s.focusOrAddTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);

  const list = useMemo(
    () => Array.from(terminals.values())
      .filter((t) => t.cwd === cwd && t.shell !== 'claude')
      .sort((a, b) => a.createdAt - b.createdAt),
    [terminals, cwd],
  );

  const handleNew = async () => {
    const id = await createTerminal(cwd);
    const tab: TabItem = {
      id,
      type: 'terminal',
      title: useTerminalStore.getState().getTitle(id),
      metadata: { terminalId: id },
    };
    addTab(activePaneId, tab);
  };

  const handleSelect = (id: string) => {
    const tab: TabItem = {
      id,
      type: 'terminal',
      title: useTerminalStore.getState().getTitle(id),
      metadata: { terminalId: id },
    };
    focusOrAddTab(activePaneId, tab);
  };

  const handleKill = (id: string) => {
    disposeTerminal(id);
    killTerminal(id);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm text-[var(--text-muted)]">
          {list.length} terminal{list.length !== 1 ? 's' : ''}
        </span>
        <IconButton icon={Plus} size={16} title="New Terminal" onClick={handleNew} />
      </div>

      {list.map((t) => (
        <button
          key={t.id}
          className="flex items-center gap-2.5 w-full px-2 py-2 text-left text-sm hover:bg-[var(--bg-surface)] rounded group"
          onClick={() => handleSelect(t.id)}
        >
          <Terminal
            size={18}
            className={t.status === 'running' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}
          />
          <div className="flex-1 min-w-0">
            <div className="truncate text-[var(--text-primary)]">{t.title}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              pid {t.pid} &middot; {t.cwd.split('/').pop()}
            </div>
          </div>
          <span
            className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-overlay)]"
            onClick={(e) => {
              e.stopPropagation();
              handleKill(t.id);
            }}
          >
            <X size={12} className="text-[var(--text-muted)]" />
          </span>
        </button>
      ))}

      {list.length === 0 && (
        <div className="px-2 text-xs text-[var(--text-muted)]">No terminals</div>
      )}
    </div>
  );
}
