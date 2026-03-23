import { useCallback, useEffect } from 'react';
import type { PaneLeaf, TabItem } from '../../../shared/types/layout';
import { TabBar } from './TabBar';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { TerminalToolbar } from '../terminal/TerminalToolbar';
import { ClaudePanel } from '../claude/ClaudePanel';
import { DiffViewer } from '../review/DiffViewer';
import { PRDetail } from '../review/PRDetail';
import { useLayoutStore } from '../../stores/layout.store';
import { useTerminalStore } from '../../stores/terminal.store';
import { useGitHubStore } from '../../stores/github.store';
import { disposeTerminal } from '../../hooks/useTerminal';
import type { DiffFile } from '../../../shared/types/git';

interface PaneContainerProps {
  pane: PaneLeaf;
  cwd: string;
}

export function PaneContainer({ pane, cwd }: PaneContainerProps) {
  const { setActiveTab, removeTab, addTab, splitPane, setActivePane, activePaneId } = useLayoutStore();
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const killTerminal = useTerminalStore((s) => s.killTerminal);
  const selectPR = useGitHubStore((s) => s.selectPR);
  const activeTab = pane.tabs.find((t) => t.id === pane.activeTabId);
  const isActivePane = pane.id === activePaneId;

  const handleNewTerminal = useCallback(async () => {
    const terminalId = await createTerminal(cwd);
    const tab: TabItem = {
      id: terminalId,
      type: 'terminal',
      title: 'Terminal',
      metadata: { terminalId },
    };
    addTab(pane.id, tab);
  }, [cwd, pane.id, addTab, createTerminal]);

  const handleCloseTab = useCallback(
    (tabId: string) => {
      removeTab(pane.id, tabId);
    },
    [pane.id, removeTab],
  );

  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTab(pane.id, tabId);
      setActivePane(pane.id);
    },
    [pane.id, setActiveTab, setActivePane],
  );

  const handleSplit = useCallback(
    async (direction: 'horizontal' | 'vertical') => {
      const terminalId = await createTerminal(cwd);
      const tab: TabItem = {
        id: terminalId,
        type: 'terminal',
        title: 'Terminal',
        metadata: { terminalId },
      };
      splitPane(pane.id, direction, tab);
    },
    [cwd, pane.id, splitPane, createTerminal],
  );

  const handleKillTerminal = useCallback(() => {
    if (activeTab) {
      disposeTerminal(activeTab.id);
      killTerminal(activeTab.id);
      removeTab(pane.id, activeTab.id);
    }
  }, [activeTab, pane.id, killTerminal, removeTab]);

  const toolbar = activeTab?.type === 'terminal' ? (
    <TerminalToolbar
      onSplitHorizontal={() => handleSplit('horizontal')}
      onSplitVertical={() => handleSplit('vertical')}
      onKill={handleKillTerminal}
    />
  ) : null;

  return (
    <div
      className="flex flex-col h-full"
      onClick={() => setActivePane(pane.id)}
    >
      <TabBar
        tabs={pane.tabs}
        activeTabId={pane.activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTerminal={handleNewTerminal}
        trailing={toolbar}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab?.type === 'terminal' && (
          <TerminalPanel
            terminalId={activeTab.id}
            isActive={isActivePane}
          />
        )}
        {activeTab?.type === 'claude' && (
          <ClaudePanel
            sessionId={activeTab.id}
            cwd={cwd}
            isActive={isActivePane}
          />
        )}
        {activeTab?.type === 'diff' && (
          <DiffViewer files={(activeTab.metadata.diffFiles as DiffFile[]) || []} />
        )}
        {activeTab?.type === 'pr' && (
          <PRDetailLoader cwd={cwd} prNumber={activeTab.metadata.prNumber as number} selectPR={selectPR} />
        )}
        {activeTab && !['terminal', 'claude', 'diff', 'pr'].includes(activeTab.type) && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            {activeTab.type} panel (coming soon)
          </div>
        )}
      </div>
    </div>
  );
}

function PRDetailLoader({ cwd, prNumber, selectPR }: { cwd: string; prNumber: number; selectPR: (cwd: string, n: number) => Promise<void> }) {
  useEffect(() => {
    selectPR(cwd, prNumber);
  }, [cwd, prNumber, selectPR]);

  return <PRDetail cwd={cwd} />;
}
