import { useUIStore } from '../../stores/ui.store';
import { useLayoutStore } from '../../stores/layout.store';
import { useGitStore } from '../../stores/git.store';
import { diffName, prName } from '../../lib/names';
import { GitStatus } from '../git/GitStatus';
import { BranchSelector } from '../git/BranchSelector';
import { CommitPanel } from '../git/CommitPanel';
import { WorktreeList } from '../worktree/WorktreeList';
import { DocsPanel } from '../docs/DocsPanel';
import { HomePanel } from './HomePanel';
import { PRList } from '../review/PRList';
import { useGitHubStore } from '../../stores/github.store';
import { useCallback } from 'react';
import { useWorkspaceStore } from '../../stores/workspace.store';
import type { TabItem } from '../../../shared/types/layout';

const panelTitles: Record<string, string> = {
  home: 'Home',
  docs: 'Definitions',
  git: 'Git',
  worktrees: 'Worktrees',
  github: 'GitHub',
};

export function Sidebar() {
  const activeSidebarPanel = useUIStore((s) => s.activeSidebarPanel);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const addTab = useLayoutStore((s) => s.addTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const getDiff = useGitStore((s) => s.getDiff);
  const cwd = useWorkspaceStore((s) => s.projectPath);

  const handleOpenDiff = useCallback(
    async (file: string, staged: boolean) => {
      const files = await getDiff(staged, file);
      const tab: TabItem = {
        id: `diff-${file}-${staged ? 'staged' : 'unstaged'}`,
        type: 'diff',
        title: diffName(file),
        metadata: { file, staged, diffFiles: files },
      };
      addTab(activePaneId, tab);
    },
    [getDiff, addTab, activePaneId],
  );

  const removeTabById = useLayoutStore((s) => s.removeTabById);
  const insertTabAt = useLayoutStore((s) => s.insertTabAt);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);

  const handleOpenAllChanges = useCallback(async (scrollToFile?: string) => {
    const [stagedFiles, unstagedFiles] = await Promise.all([
      getDiff(true),
      getDiff(false),
    ]);
    const allFiles = [...stagedFiles, ...unstagedFiles];
    // Remove old tab so metadata (scrollToFile, diffFiles) refreshes
    removeTabById('diff-all-changes');
    const tab: TabItem = {
      id: 'diff-all-changes',
      type: 'diff',
      title: 'All Changes',
      metadata: { diffFiles: allFiles, scrollToFile, reservedIndex: 3 },
    };
    insertTabAt(activePaneId, tab, 3);
    setActiveTab(activePaneId, tab.id);
  }, [getDiff, insertTabAt, setActiveTab, removeTabById, activePaneId]);

  return (
    <div
      className="flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-hidden"
      style={{ width: sidebarWidth, minWidth: 150 }}
    >
      <div className="flex items-center h-10 px-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
        {panelTitles[activeSidebarPanel] || activeSidebarPanel}
      </div>
      <div className="flex-1 overflow-y-auto text-sm" style={{ paddingLeft: 4 }}>
        {activeSidebarPanel === 'home' && cwd && (
          <HomePanel cwd={cwd} />
        )}
        {activeSidebarPanel === 'docs' && cwd && (
          <DocsPanel cwd={cwd} />
        )}
        {activeSidebarPanel === 'git' && (
          <div className="p-1">
            <BranchSelector />
            <GitStatus onOpenDiff={handleOpenDiff} onOpenAllChanges={handleOpenAllChanges} />
            <CommitPanel />
          </div>
        )}
        {activeSidebarPanel === 'worktrees' && (
          <div className="p-1">
            <WorktreeList />
          </div>
        )}
        {activeSidebarPanel === 'github' && cwd && (
          <PRList
            cwd={cwd}
            onSelectPR={(pr) => {
              const tab: TabItem = {
                id: `pr-${pr.number}`,
                type: 'pr',
                title: prName(pr.number),
                metadata: { prNumber: pr.number },
              };
              addTab(activePaneId, tab);
            }}
          />
        )}
        {!['home', 'docs', 'git', 'worktrees', 'github'].includes(activeSidebarPanel) && (
          <div className="p-2 text-[var(--text-muted)] text-xs">
            {activeSidebarPanel} panel content coming soon
          </div>
        )}
      </div>
    </div>
  );
}
