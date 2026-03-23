import { useUIStore } from '../../stores/ui.store';
import { useLayoutStore } from '../../stores/layout.store';
import { useClaudeStore } from '../../stores/claude.store';
import { useGitStore } from '../../stores/git.store';
import { useClaude } from '../../hooks/useClaude';
import { SessionList } from '../claude/SessionList';
import { GitStatus } from '../git/GitStatus';
import { BranchSelector } from '../git/BranchSelector';
import { CommitPanel } from '../git/CommitPanel';
import { WorktreeList } from '../worktree/WorktreeList';
import { PRList } from '../review/PRList';
import { useGitHubStore } from '../../stores/github.store';
import { getApi } from '../../lib/ipc';
import { useEffect, useState, useCallback } from 'react';
import type { TabItem } from '../../../shared/types/layout';
import type { DiffFile } from '../../../shared/types/git';

const panelTitles: Record<string, string> = {
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
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActiveSession = useClaudeStore((s) => s.setActiveSession);
  const getDiff = useGitStore((s) => s.getDiff);
  const { startSession } = useClaude();
  const [cwd, setCwd] = useState('');

  useEffect(() => {
    getApi().shell.info().then((info) => setCwd(info.cwd));
  }, []);

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: 'Claude',
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  };

  const handleNewSession = () => {
    if (!cwd) return;
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: 'Claude',
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
        title: file.split('/').pop() || file,
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
      <div className="flex items-center h-9 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
        {panelTitles[activeSidebarPanel] || activeSidebarPanel}
      </div>
      <div className="flex-1 overflow-y-auto">
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
                title: `PR #${pr.number}`,
                metadata: { prNumber: pr.number },
              };
              addTab(activePaneId, tab);
            }}
          />
        )}
        {!['claude-sessions', 'git', 'worktrees', 'github'].includes(activeSidebarPanel) && (
          <div className="p-2 text-[var(--text-muted)] text-xs">
            {activeSidebarPanel} panel content coming soon
          </div>
        )}
      </div>
    </div>
  );
}
