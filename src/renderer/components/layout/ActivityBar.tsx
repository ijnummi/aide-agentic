import { Home, Terminal, Bot, GitBranch, GitFork, Github } from 'lucide-react';
import { useUIStore, type SidebarPanel } from '../../stores/ui.store';

const items: { panel: SidebarPanel; icon: typeof Terminal; label: string }[] = [
  { panel: 'home', icon: Home, label: 'Home' },
  { panel: 'terminals', icon: Terminal, label: 'Terminals' },
  { panel: 'claude-sessions', icon: Bot, label: 'Claude Sessions' },
  { panel: 'git', icon: GitBranch, label: 'Git' },
  { panel: 'worktrees', icon: GitFork, label: 'Worktrees' },
  { panel: 'github', icon: Github, label: 'GitHub' },
];

export function ActivityBar() {
  const activeSidebarPanel = useUIStore((s) => s.activeSidebarPanel);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);

  return (
    <div className="flex flex-col items-center w-14 bg-[var(--bg-secondary)] border-r border-[var(--border)] py-1 select-none">
      {items.map(({ panel, icon: Icon, label }) => {
        const isActive = sidebarVisible && activeSidebarPanel === panel;
        return (
          <button
            key={panel}
            className={`flex items-center justify-center w-12 h-12 my-0.5 rounded transition-colors ${
              isActive
                ? 'text-[var(--text-primary)] bg-[var(--bg-surface)] border-l-2 border-l-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setSidebarPanel(panel)}
            title={label}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}
