import { useMemo } from 'react';
import { BookOpen, FileText, ListTodo, Wand2, RefreshCw } from 'lucide-react';
import { useDocsStore } from '../../stores/docs.store';
import { useLayoutStore } from '../../stores/layout.store';
import { IconButton } from '../shared/IconButton';
import type { DocCategory, DocFileEntry } from '../../../shared/types/docs';
import type { TabItem } from '../../../shared/types/layout';

interface DocsPanelProps {
  cwd: string;
}

const categoryMeta: Record<DocCategory, { icon: typeof FileText; label: string; order: number }> = {
  skills:        { icon: Wand2,    label: 'Skills',        order: 0 },
  instructions:  { icon: BookOpen, label: 'Instructions',  order: 1 },
  documentation: { icon: FileText, label: 'Documentation', order: 2 },
  tasks:         { icon: ListTodo, label: 'Tasks',         order: 3 },
};

export function DocsPanel({ cwd }: DocsPanelProps) {
  const files = useDocsStore((s) => s.files);
  const isLoading = useDocsStore((s) => s.isLoading);
  const refresh = useDocsStore((s) => s.refresh);
  const focusOrAddTab = useLayoutStore((s) => s.focusOrAddTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);

  const grouped = useMemo(() => {
    const map = new Map<DocCategory, DocFileEntry[]>();
    for (const f of files) {
      const list = map.get(f.category) || [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => categoryMeta[a].order - categoryMeta[b].order);
  }, [files]);

  const handleOpen = (file: DocFileEntry) => {
    const tab: TabItem = {
      id: `doc:${file.relativePath}`,
      type: 'document',
      title: file.name,
      metadata: { filePath: file.path, relativePath: file.relativePath },
    };
    focusOrAddTab(activePaneId, tab);
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-[var(--text-muted)]">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
        <IconButton
          icon={RefreshCw}
          size={12}
          title="Refresh"
          onClick={refresh}
          className={isLoading ? 'animate-spin' : ''}
        />
      </div>

      {grouped.map(([category, items]) => {
        const meta = categoryMeta[category];
        const Icon = meta.icon;
        return (
          <div key={category}>
            <div className="flex items-center gap-2 px-1 mb-1">
              <Icon size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {meta.label}
              </span>
              <span className="text-xs text-[var(--text-muted)]">({items.length})</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((file) => (
                <button
                  key={file.path}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[var(--bg-surface)] w-full"
                  onClick={() => handleOpen(file)}
                >
                  <FileText size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--text-primary)] truncate">{file.name}</div>
                    {file.relativePath !== file.name && (
                      <div className="text-xs text-[var(--text-muted)] truncate">{file.relativePath}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {files.length === 0 && !isLoading && (
        <div className="px-2 text-xs text-[var(--text-muted)]">No documentation files found</div>
      )}
    </div>
  );
}
