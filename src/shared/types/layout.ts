export type TabType = 'terminal' | 'claude' | 'diff' | 'pr' | 'worktrees' | 'git-status' | 'document';

export interface TabItem {
  id: string;
  type: TabType;
  title: string;
  icon?: string;
  metadata: Record<string, unknown>;
  dirty?: boolean;
}

export interface PaneLeaf {
  id: string;
  type: 'pane';
  activeTabId: string;
  tabs: TabItem[];
}

export interface LayoutNode {
  id: string;
  type: 'split';
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  children: (LayoutNode | PaneLeaf)[];
}

export type LayoutTree = LayoutNode | PaneLeaf;
