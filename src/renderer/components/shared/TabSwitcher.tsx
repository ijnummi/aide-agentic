import { Terminal, Bot, GitCompare, GitPullRequest, FileText, ClipboardList } from 'lucide-react';
import { useTabSwitcherStore } from '../../stores/tabswitcher.store';
import type { TabType } from '../../../shared/types/layout';

const tabIcons: Record<TabType, typeof Terminal> = {
  terminal: Terminal,
  claude: Bot,
  diff: GitCompare,
  pr: GitPullRequest,
  worktrees: GitCompare,
  'git-status': GitCompare,
  document: FileText,
  'cr-spec': ClipboardList,
};

export function TabSwitcher() {
  const { visible, tabs, selectedIndex } = useTabSwitcherStore();

  if (!visible || tabs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20%] pointer-events-none">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl w-[320px] overflow-hidden pointer-events-auto">
        <div className="px-3 py-1.5 text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
          Switch Tab
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {tabs.map((tab, i) => {
            const Icon = tabIcons[tab.type] || Terminal;
            const isSelected = i === selectedIndex;
            return (
              <div
                key={tab.id}
                className={`flex items-center gap-2.5 px-3 py-1.5 text-sm ${
                  isSelected
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-[var(--accent)]' : ''} />
                <span className="truncate">{tab.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
