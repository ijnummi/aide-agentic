export type ShortcutCategory = 'General' | 'Terminal' | 'Navigation' | 'Claude' | 'Git';

export interface ShortcutEntry {
  id: string;
  label: string;
  shortcut: string;
  category: ShortcutCategory;
}

export const SHORTCUTS: ShortcutEntry[] = [
  // General
  { id: 'toggle-sidebar',   label: 'Toggle Sidebar',            shortcut: 'Ctrl+B',         category: 'General' },
  { id: 'quick-switcher',   label: 'Quick Switcher',            shortcut: 'Ctrl+P',         category: 'General' },
  { id: 'command-palette',  label: 'Command Palette',           shortcut: 'Ctrl+Shift+P',   category: 'General' },
  { id: 'show-shortcuts',   label: 'Keyboard Shortcuts',        shortcut: '?',               category: 'General' },

  // Terminal
  { id: 'new-terminal',     label: 'New Terminal',              shortcut: 'Ctrl+T',         category: 'Terminal' },
  { id: 'split-horizontal', label: 'Split Right',               shortcut: 'Ctrl+\\',            category: 'Terminal' },
  { id: 'split-vertical',   label: 'Split Down',                shortcut: 'Ctrl+Shift+\\',      category: 'Terminal' },
  { id: 'split-right-alt',  label: 'Split Right',               shortcut: 'Ctrl+Shift+Alt+→',   category: 'Terminal' },
  { id: 'split-down-alt',   label: 'Split Down',                shortcut: 'Ctrl+Shift+Alt+↓',   category: 'Terminal' },

  // Navigation
  { id: 'switch-tab',       label: 'Next Tab (picker)',          shortcut: 'Ctrl+Tab',           category: 'Navigation' },
  { id: 'switch-tab-prev',  label: 'Previous Tab (picker)',      shortcut: 'Ctrl+Shift+Tab',     category: 'Navigation' },
  { id: 'nav-left',         label: 'Pane Left / Prev Tab',       shortcut: 'Alt+←',              category: 'Navigation' },
  { id: 'nav-right',        label: 'Pane Right / Next Tab',      shortcut: 'Alt+→',              category: 'Navigation' },
  { id: 'nav-up',           label: 'Pane Up',                    shortcut: 'Alt+↑',              category: 'Navigation' },
  { id: 'nav-down',         label: 'Pane Down',                  shortcut: 'Alt+↓',              category: 'Navigation' },
  { id: 'focus-tab-n',      label: 'Focus Tab by Number',        shortcut: 'Alt+1..0',           category: 'Navigation' },

  // Git
  { id: 'prev-worktree',    label: 'Previous Worktree',         shortcut: 'Ctrl+Shift+←',   category: 'Git' },
  { id: 'next-worktree',    label: 'Next Worktree',             shortcut: 'Ctrl+Shift+→',   category: 'Git' },

  // Claude
  { id: 'new-claude',       label: 'New Claude Session',        shortcut: 'Ctrl+Shift+C',   category: 'Claude' },
];

const CATEGORY_ORDER: ShortcutCategory[] = ['General', 'Terminal', 'Navigation', 'Claude', 'Git'];

export function getShortcutsByCategory(): Map<ShortcutCategory, ShortcutEntry[]> {
  const map = new Map<ShortcutCategory, ShortcutEntry[]>();
  for (const cat of CATEGORY_ORDER) {
    const entries = SHORTCUTS.filter((s) => s.category === cat);
    if (entries.length > 0) {
      map.set(cat, entries);
    }
  }
  return map;
}
