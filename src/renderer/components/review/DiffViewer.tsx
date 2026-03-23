import type { DiffFile } from '../../../shared/types/git';

interface DiffViewerProps {
  files: DiffFile[];
}

export function DiffViewer({ files }: DiffViewerProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        No changes to display
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-2">
      {files.map((file, fi) => (
        <div key={fi} className="mb-4 border border-[var(--border)] rounded overflow-hidden">
          {/* File header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] text-xs border-b border-[var(--border)]">
            <StatusBadge status={file.status} />
            <span className="font-medium text-[var(--text-primary)]">
              {file.status === 'renamed' ? `${file.oldPath} → ${file.newPath}` : file.newPath}
            </span>
          </div>

          {/* Hunks */}
          {file.hunks.map((hunk, hi) => (
            <div key={hi}>
              <div className="px-3 py-0.5 bg-[var(--bg-secondary)] text-[var(--accent)] text-xs font-mono border-b border-[var(--border)]">
                @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@ {hunk.header}
              </div>
              <div className="font-mono text-xs">
                {hunk.lines.map((line, li) => {
                  let bg = '';
                  let fg = 'var(--text-primary)';
                  let prefix = ' ';

                  if (line.type === 'add') {
                    bg = 'rgba(166, 227, 161, 0.1)';
                    fg = 'var(--success)';
                    prefix = '+';
                  } else if (line.type === 'delete') {
                    bg = 'rgba(243, 139, 168, 0.1)';
                    fg = 'var(--error)';
                    prefix = '-';
                  }

                  return (
                    <div
                      key={li}
                      className="flex"
                      style={{ backgroundColor: bg }}
                    >
                      <span className="w-12 text-right pr-2 text-[var(--text-muted)] select-none border-r border-[var(--border)] flex-shrink-0">
                        {line.oldLineNumber ?? ''}
                      </span>
                      <span className="w-12 text-right pr-2 text-[var(--text-muted)] select-none border-r border-[var(--border)] flex-shrink-0">
                        {line.newLineNumber ?? ''}
                      </span>
                      <span className="w-4 text-center flex-shrink-0" style={{ color: fg }}>
                        {prefix}
                      </span>
                      <span className="flex-1 px-1 whitespace-pre" style={{ color: fg }}>
                        {line.content}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DiffFile['status'] }) {
  const colors: Record<string, string> = {
    added: 'var(--success)',
    modified: 'var(--warning)',
    deleted: 'var(--error)',
    renamed: 'var(--accent)',
  };
  const labels: Record<string, string> = {
    added: 'A',
    modified: 'M',
    deleted: 'D',
    renamed: 'R',
  };

  return (
    <span
      className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold"
      style={{ color: colors[status], border: `1px solid ${colors[status]}` }}
    >
      {labels[status]}
    </span>
  );
}
