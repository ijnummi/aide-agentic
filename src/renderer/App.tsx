import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TitleBar } from './components/layout/TitleBar';
import { CommandPalette, type Command } from './components/shared/CommandPalette';
import { ToastContainer } from './components/shared/Toast';
import { TabSwitcher } from './components/shared/TabSwitcher';
import { ShortcutOverlay } from './components/shared/ShortcutOverlay';
import { useUIStore } from './stores/ui.store';
import { useSettingsStore } from './stores/settings.store';
import { useTerminalStore } from './stores/terminal.store';
import { useLayoutStore } from './stores/layout.store';
import { useClaude } from './hooks/useClaude';
import { usePersistence } from './hooks/usePersistence';
import { getApi } from './lib/ipc';
import type { TabItem } from '../shared/types/layout';

export function App() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);
  const addTab = useLayoutStore((s) => s.addTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const { startSession } = useClaude();
  const { save } = usePersistence();
  const settings = useSettingsStore((s) => s.settings);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [cwd, setCwd] = useState('');

  // Apply theme + font settings to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('font-size', `${settings.font.uiSize}px`);
    document.documentElement.style.setProperty('font-family', settings.font.family);
  }, [theme, settings.font.uiSize, settings.font.family]);

  useEffect(() => {
    getApi().shell.info().then((info) => setCwd(info.cwd));
  }, []);

  // Ctrl+Shift+P — command palette, ? — shortcut overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      // ? — only when not in terminal or input
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const active = document.activeElement;
        const inTerminal = active?.closest('.xterm');
        const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
        if (!inTerminal && !inInput) {
          e.preventDefault();
          setShortcutsOpen((o) => !o);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNewTerminal = useCallback(async () => {
    if (!cwd) return;
    const id = await createTerminal(cwd);
    const tab: TabItem = {
      id,
      type: 'terminal',
      title: useTerminalStore.getState().getTitle(id),
      metadata: { terminalId: id },
    };
    addTab(activePaneId, tab);
  }, [cwd, createTerminal, addTab, activePaneId]);

  const handleNewClaude = useCallback(() => {
    if (!cwd) return;
    const sessionId = startSession(cwd);
    const tab: TabItem = {
      id: sessionId,
      type: 'claude',
      title: 'Claude',
      metadata: { sessionId },
    };
    addTab(activePaneId, tab);
  }, [cwd, startSession, addTab, activePaneId]);

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        shortcut: 'Ctrl+B',
        action: toggleSidebar,
      },
      {
        id: 'new-terminal',
        label: 'New Terminal',
        shortcut: 'Ctrl+T',
        action: handleNewTerminal,
      },
      {
        id: 'new-claude',
        label: 'New Claude Session',
        shortcut: 'Ctrl+Shift+C',
        action: handleNewClaude,
      },
      {
        id: 'save-session',
        label: 'Save Session',
        shortcut: 'Ctrl+S',
        action: save,
      },
      {
        id: 'show-terminals',
        label: 'Show: Terminals',
        action: () => setSidebarPanel('terminals'),
      },
      {
        id: 'show-claude',
        label: 'Show: Claude Sessions',
        action: () => setSidebarPanel('claude-sessions'),
      },
      {
        id: 'show-git',
        label: 'Show: Git',
        action: () => setSidebarPanel('git'),
      },
      {
        id: 'show-worktrees',
        label: 'Show: Worktrees',
        action: () => setSidebarPanel('worktrees'),
      },
      {
        id: 'show-github',
        label: 'Show: GitHub PRs',
        action: () => setSidebarPanel('github'),
      },
    ],
    [theme, setTheme, toggleSidebar, setSidebarPanel, handleNewTerminal, handleNewClaude, save],
  );

  return (
    <div data-theme={theme} className="app-frame">
      <TitleBar
        onCommandPalette={() => setPaletteOpen((o) => !o)}
        onSave={save}
        onNewTerminal={handleNewTerminal}
        onNewClaude={handleNewClaude}
      />
      <div className="flex-1 overflow-hidden">
        <AppShell />
      </div>
      <CommandPalette commands={commands} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <TabSwitcher />
      <ToastContainer />
    </div>
  );
}
