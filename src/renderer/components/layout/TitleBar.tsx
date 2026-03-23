import { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Terminal,
  Bot,
  GitBranch,
  GitFork,
  Github,
  Command,
  Save,
} from 'lucide-react';
import { getApi } from '../../lib/ipc';
import { useUIStore } from '../../stores/ui.store';
import { useGitStore } from '../../stores/git.store';

interface TitleBarProps {
  onCommandPalette: () => void;
  onSave: () => void;
  onNewTerminal: () => void;
  onNewClaude: () => void;
}

export function TitleBar({ onCommandPalette, onSave, onNewTerminal, onNewClaude }: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);
  const branch = useGitStore((s) => s.branch);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);

  useEffect(() => {
    const check = async () => setMaximized(await getApi().window.isMaximized());
    check();
    // Re-check on resize
    const handler = () => check();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="flex items-center h-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] select-none text-xs">
      {/* Drag region + app title */}
      <div
        className="flex items-center gap-2 px-3 h-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="font-semibold text-[var(--accent)]">AIDE</span>
        {branch && (
          <span className="text-[var(--text-muted)]">
            <GitBranch size={11} className="inline -mt-px mr-0.5" />
            {branch}
          </span>
        )}
      </div>

      {/* Toolbar buttons */}
      <div
        className="flex items-center gap-0.5 px-1 h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ToolbarButton icon={Terminal} title="New Terminal (Ctrl+T)" onClick={onNewTerminal} />
        <ToolbarButton icon={Bot} title="New Claude (Ctrl+Shift+C)" onClick={onNewClaude} />
        <ToolbarSep />
        <ToolbarButton icon={GitBranch} title="Git" onClick={() => setSidebarPanel('git')} />
        <ToolbarButton icon={GitFork} title="Worktrees" onClick={() => setSidebarPanel('worktrees')} />
        <ToolbarButton icon={Github} title="GitHub" onClick={() => setSidebarPanel('github')} />
        <ToolbarSep />
        <ToolbarButton icon={Save} title="Save Session (Ctrl+S)" onClick={onSave} />
        <ToolbarButton icon={Command} title="Command Palette (Ctrl+Shift+P)" onClick={onCommandPalette} />
      </div>

      {/* Spacer — draggable */}
      <div
        className="flex-1 h-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          className="flex items-center justify-center w-11 h-full text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors"
          onClick={() => getApi().window.minimize()}
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="flex items-center justify-center w-11 h-full text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors"
          onClick={() => { getApi().window.maximize(); }}
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button
          className="flex items-center justify-center w-11 h-full text-[var(--text-muted)] hover:bg-[var(--error)] hover:text-white transition-colors"
          onClick={() => getApi().window.close()}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, title, onClick }: { icon: typeof Terminal; title: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center justify-center w-7 h-6 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
      onClick={onClick}
      title={title}
    >
      <Icon size={14} />
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-4 bg-[var(--border)] mx-0.5" />;
}
