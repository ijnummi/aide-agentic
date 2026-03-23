import { Plus, X, Terminal, Bot, GitCompare, GitPullRequest } from 'lucide-react';
import type { TabItem, TabType } from '../../../shared/types/layout';

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTerminal: () => void;
  trailing?: React.ReactNode;
}

const tabIcons: Record<TabType, React.ComponentType<{ size?: number }>> = {
  terminal: Terminal,
  claude: Bot,
  diff: GitCompare,
  pr: GitPullRequest,
  worktrees: GitCompare,
  'git-status': GitCompare,
};

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTerminal, trailing }: TabBarProps) {
  return (
    <div className="flex items-center h-9 bg-[var(--bg-secondary)] border-b border-[var(--border)] select-none">
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.type] || Terminal;
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 h-9 text-xs border-r border-[var(--border)] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
              onClick={() => onSelectTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.title}</span>
              <span
                className="ml-1 rounded hover:bg-[var(--bg-overlay)] p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <X size={12} />
              </span>
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
