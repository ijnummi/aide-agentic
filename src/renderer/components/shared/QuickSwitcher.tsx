import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Terminal, Bot, GitCompare, GitPullRequest, GitFork, FileText, ClipboardList } from 'lucide-react';
import { useLayoutStore, findPane } from '../../stores/layout.store';
import { useWorktreeStore } from '../../stores/worktree.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { switchWorkspace } from '../../lib/workspace';
import { baseName } from '../../lib/path';
import type { TabType, TabItem, LayoutTree } from '../../../shared/types/layout';

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

interface QuickSwitcherItem {
  id: string;
  label: string;
  detail?: string;
  section: 'tabs' | 'worktrees';
  icon: typeof Terminal;
  active?: boolean;
  action: () => void;
}

function collectTabs(node: LayoutTree): { tab: TabItem; paneId: string }[] {
  if (node.type === 'pane') {
    return node.tabs.map((tab) => ({ tab, paneId: node.id }));
  }
  return node.children.flatMap((child) => collectTabs(child));
}

interface QuickSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export function QuickSwitcher({ open, onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const root = useLayoutStore((s) => s.root);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const setActivePane = useLayoutStore((s) => s.setActivePane);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const currentPath = useWorkspaceStore((s) => s.projectPath);
  const items = useMemo((): QuickSwitcherItem[] => {
    const result: QuickSwitcherItem[] = [];

    if (root) {
      const allTabs = collectTabs(root);
      for (const { tab, paneId } of allTabs) {
        result.push({
          id: `tab:${tab.id}`,
          label: tab.title,
          detail: tab.type,
          section: 'tabs',
          icon: tabIcons[tab.type] || Terminal,
          action: () => {
            setActiveTab(paneId, tab.id);
            setActivePane(paneId);
          },
        });
      }
    }

    for (const wt of worktrees) {
      result.push({
        id: `wt:${wt.path}`,
        label: baseName(wt.path),
        detail: wt.branch,
        section: 'worktrees',
        icon: GitFork,
        active: wt.path === currentPath,
        action: () => { switchWorkspace(wt.path); },
      });
    }

    return result;
  }, [root, worktrees, currentPath, setActiveTab, setActivePane]);

  // Filter + group + flatten in one pass
  const { sections, flatItems } = useMemo(() => {
    const q = query.toLowerCase();
    const matched = query ? items.filter((i) => i.label.toLowerCase().includes(q) || i.detail?.toLowerCase().includes(q)) : items;
    const tabs = matched.filter((i) => i.section === 'tabs');
    const wts = matched.filter((i) => i.section === 'worktrees');
    const secs: { label: string; items: QuickSwitcherItem[]; startIndex: number }[] = [];
    let offset = 0;
    if (tabs.length > 0) { secs.push({ label: 'Open Tabs', items: tabs, startIndex: offset }); offset += tabs.length; }
    if (wts.length > 0) { secs.push({ label: 'Worktrees', items: wts, startIndex: offset }); }
    return { sections: secs, flatItems: [...tabs, ...wts] };
  }, [items, query]);

  const activeTabId = useMemo(() => {
    if (!root) return null;
    return findPane(root, activePaneId)?.activeTabId ?? null;
  }, [root, activePaneId]);

  useEffect(() => {
    if (open) {
      setQuery('');
      // Default to the currently focused tab
      const idx = activeTabId ? flatItems.findIndex((i) => i.id === `tab:${activeTabId}`) : -1;
      setSelectedIndex(idx >= 0 ? idx : 0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatItems, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%]" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
          <Search size={14} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Switch to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div ref={listRef} className="max-h-72 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-primary)]">
                {section.label}
              </div>
              {section.items.map((item, itemIndex) => {
                const idx = section.startIndex + itemIndex;
                const isSelected = idx === selectedIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-selected={isSelected}
                    className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-left ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                    }`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                  >
                    <Icon
                      size={14}
                      className={item.active ? 'text-[var(--accent)]' : isSelected ? 'text-[var(--accent)]' : ''}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.detail && (
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.detail}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {flatItems.length === 0 && (
            <div className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}
