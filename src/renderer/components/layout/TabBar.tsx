import { useMemo } from 'react';
import { Plus, X, Terminal, Bot, GitCompare, GitPullRequest, FileText, ClipboardList } from 'lucide-react';
import { getTabNumbers } from '../../lib/tab-numbers';
import type { TabItem, TabType } from '../../../shared/types/layout';

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTerminal: () => void;
  trailing?: React.ReactNode;
}

const tabIcons: Record<TabType, React.ComponentType<{ size?: number; className?: string }>> = {
  terminal: Terminal,
  claude: Bot,
  diff: GitCompare,
  pr: GitPullRequest,
  worktrees: GitCompare,
  'git-status': GitCompare,
  document: FileText,
  'cr-spec': ClipboardList,
};

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTerminal, trailing }: TabBarProps) {
  const tabNumbers = useMemo(() => getTabNumbers(tabs), [tabs]);

  return (
    <div className="flex items-center h-9 bg-[var(--bg-secondary)] border-b border-[var(--border)] select-none">
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.type] || Terminal;
          const isActive = tab.id === activeTabId;
          const posNumber = tabNumbers.get(tab.id) ?? 0;
          const isPrimary = tab.metadata?.isPrimary === true;

          return (
            <button
              key={tab.id}
              style={{ paddingLeft: 6, paddingRight: 6 }}
              className={`flex items-center gap-1.5 h-9 text-xs border-r border-[var(--border)] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
              onClick={() => onSelectTab(tab.id)}
              title={posNumber <= 10 ? `Alt+${posNumber % 10}` : undefined}
            >
              <Icon size={14} className={isActive ? 'text-[var(--accent)]' : ''} />
              <span>{tab.title}</span>
              {posNumber <= 10 && (
                <span className={`min-w-[18px] h-[16px] flex items-center justify-center rounded-sm text-[10px] font-mono leading-none ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}>
                  {posNumber % 10}
                </span>
              )}
              {!isPrimary && (
                <span
                  className="ml-0.5 rounded hover:bg-[var(--bg-overlay)] p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                >
                  <X size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        className="flex items-center justify-center w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        onClick={onNewTerminal}
        title="New Terminal (Ctrl+T)"
      >
        <Plus size={16} />
      </button>
      {trailing}
    </div>
  );
}
