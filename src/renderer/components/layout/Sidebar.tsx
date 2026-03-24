import { useUIStore } from '../../stores/ui.store';
import { useLayoutStore } from '../../stores/layout.store';
import { useClaudeStore } from '../../stores/claude.store';
import { useGitStore } from '../../stores/git.store';
import { useClaude } from '../../hooks/useClaude';
import { claudeName, diffName, prName } from '../../lib/names';
import { SessionList } from '../claude/SessionList';
import { GitStatus } from '../git/GitStatus';
import { BranchSelector } from '../git/BranchSelector';
import { CommitPanel } from '../git/CommitPanel';
import { TerminalList } from '../terminal/TerminalList';
import { WorktreeList } from '../worktree/WorktreeList';
import { HomePanel } from './HomePanel';
import { PRList } from '../review/PRList';
import { useGitHubStore } from '../../stores/github.store';
import { useCallback } from 'react';
import { useWorkspaceStore } from '../../stores/workspace.store';
import type { TabItem } from '../../../shared/types/layout';
import type { DiffFile } from '../../../shared/types/git';

const panelTitles: Record<string, string> = {
  home: 'Home',
  terminals: 'Terminals',
  'claude-sessions': 'Claude Sessions',
  git: 'Git',
  worktrees: 'Worktrees',
  github: 'GitHub',
};

export function Sidebar() {
  const activeSidebarPanel = useUIStore((s) => s.activeSidebarPanel);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const addTab = useLayoutStore((s) => s.addTab);
  const focusOrAddTab = useLayoutStore((s) => s.focusOrAddTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActiveSession = useClaudeStore((s) => s.setActiveSession);
  const getDiff = useGitStore((s) => s.getDiff);
  const { startSession } = useClaude();
  const cwd = useWorkspaceStore((s) => s.projectPath);

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: claudeName(),
      metadata: { sessionId },
    };
    focusOrAddTab(activePaneId, tab);
  };

  const handleNewSession = () => {
    if (!cwd) return;
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: claudeName(),
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  };

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
        {activeSidebarPanel === 'terminals' && cwd && (
          <div className="p-1">
            <TerminalList cwd={cwd} />
          </div>
        )}
        {activeSidebarPanel === 'claude-sessions' && (
          <SessionList
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        )}
        {activeSidebarPanel === 'git' && (
          <div className="p-1">
            <BranchSelector />
            <GitStatus onOpenDiff={handleOpenDiff} />
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
        {!['home', 'terminals', 'claude-sessions', 'git', 'worktrees', 'github'].includes(activeSidebarPanel) && (
          <div className="p-2 text-[var(--text-muted)] text-xs">
            {activeSidebarPanel} panel content coming soon
          </div>
        )}
      </div>
    </div>
  );
}
