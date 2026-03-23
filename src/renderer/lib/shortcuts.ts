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
  { id: 'save-session',     label: 'Save Session',              shortcut: 'Ctrl+S',         category: 'General' },
  { id: 'command-palette',  label: 'Command Palette',           shortcut: 'Ctrl+Shift+P',   category: 'General' },
  { id: 'show-shortcuts',   label: 'Keyboard Shortcuts',        shortcut: '?',               category: 'General' },

  // Terminal
  { id: 'new-terminal',     label: 'New Terminal',              shortcut: 'Ctrl+T',         category: 'Terminal' },
  { id: 'split-horizontal', label: 'Split Horizontal',          shortcut: 'Ctrl+\\',        category: 'Terminal' },
  { id: 'split-vertical',   label: 'Split Vertical',            shortcut: 'Ctrl+Shift+\\',  category: 'Terminal' },

  // Navigation
  { id: 'switch-tab',       label: 'Next Tab',                  shortcut: 'Ctrl+Tab',       category: 'Navigation' },
  { id: 'switch-tab-prev',  label: 'Previous Tab',              shortcut: 'Ctrl+Shift+Tab', category: 'Navigation' },

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
