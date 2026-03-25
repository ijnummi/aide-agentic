import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { computeInlineDiff, type DiffSegment } from '../../lib/inline-diff';
import type { DiffFile, DiffLine } from '../../../shared/types/git';

interface DiffViewerProps {
  files: DiffFile[];
  scrollToFile?: string;
}

export function DiffViewer({ files, scrollToFile }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to file at 15% from the top
  useEffect(() => {
    if (!scrollToFile || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-file-path="${CSS.escape(scrollToFile)}"]`);
    if (!el || !(el instanceof HTMLElement)) return;
    const container = containerRef.current;
    const offset = el.offsetTop - container.offsetTop - container.clientHeight * 0.15;
    container.scrollTop = Math.max(0, offset);
  }, [scrollToFile]);

  // Track which file is at the 15% mark during scroll
  const updateVisibleFile = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const targetY = container.scrollTop + container.clientHeight * 0.15;
    const fileEls = container.querySelectorAll<HTMLElement>('[data-file-path]');
    let visible = '';
    for (const el of fileEls) {
      const top = el.offsetTop - container.offsetTop;
      if (top <= targetY) {
        visible = el.dataset.filePath || '';
      } else {
        break;
      }
    }
    const prev = useUIStore.getState().visibleDiffFile;
    if (visible !== prev) {
      useUIStore.setState({ visibleDiffFile: visible });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateVisibleFile, { passive: true });
    updateVisibleFile();
    return () => container.removeEventListener('scroll', updateVisibleFile);
  }, [updateVisibleFile, files]);

  // Clear visible file on unmount
  useEffect(() => {
    return () => useUIStore.setState({ visibleDiffFile: '' });
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        No changes to display
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-y-auto h-full p-2">
      {files.map((file, fi) => (
        <div key={fi} style={{ marginBottom: 16 }} data-file-path={file.newPath}>
          {/* File header */}
          <div className="flex items-center gap-2 px-3 py-3 text-sm border border-[var(--border)] rounded-t">
            <StatusBadge status={file.status} />
            <span className="font-semibold text-[var(--text-primary)]">
              {file.status === 'renamed' ? `${file.oldPath} → ${file.newPath}` : file.newPath}
            </span>
          </div>

          {/* Hunks */}
          <div style={{ marginLeft: 24 }} className="border border-[var(--border)] border-t-0 rounded-b overflow-hidden">
          {file.hunks.map((hunk, hi) => (
            <div key={hi}>
              {hi > 0 && (
                <div className="px-3 py-0.5 bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)] font-mono text-center border-y border-[var(--border)]">
                  ···
                </div>
              )}
              <HunkLines lines={hunk.lines} />
            </div>
          ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const LINE_STYLES = {
  add:     { bg: 'rgba(166, 227, 161, 0.1)', fg: 'var(--success)', highlight: 'rgba(166, 227, 161, 0.25)', prefix: '+' },
  delete:  { bg: 'rgba(243, 139, 168, 0.1)', fg: 'var(--error)',   highlight: 'rgba(243, 139, 168, 0.25)', prefix: '-' },
  context: { bg: '',                          fg: 'var(--text-primary)', highlight: '',                     prefix: ' ' },
} as const;

/**
 * Pre-process hunk lines: pair adjacent delete→add runs and compute inline diffs.
 * Returns a map of line index → segments for lines that have inline highlights.
 */
function computeHunkInlineDiffs(lines: DiffLine[]): Map<number, DiffSegment[]> {
  const result = new Map<number, DiffSegment[]>();
  let i = 0;
  while (i < lines.length) {
    // Collect consecutive deletes
    const delStart = i;
    while (i < lines.length && lines[i].type === 'delete') i++;
    const delEnd = i;
    // Collect consecutive adds
    const addStart = i;
    while (i < lines.length && lines[i].type === 'add') i++;
    const addEnd = i;

    const delCount = delEnd - delStart;
    const addCount = addEnd - addStart;

    // Pair them up 1:1 for inline diffs
    const pairs = Math.min(delCount, addCount);
    for (let p = 0; p < pairs; p++) {
      const { oldSegments, newSegments } = computeInlineDiff(
        lines[delStart + p].content,
        lines[addStart + p].content,
      );
      result.set(delStart + p, oldSegments);
      result.set(addStart + p, newSegments);
    }

    // Skip context or other lines
    if (delCount === 0 && addCount === 0) i++;
  }
  return result;
}

function HunkLines({ lines }: { lines: DiffLine[] }) {
  const inlineDiffs = useMemo(() => computeHunkInlineDiffs(lines), [lines]);

  return (
    <div className="font-mono text-xs">
      {lines.map((line, li) => {
        const style = LINE_STYLES[line.type];
        const segments = inlineDiffs.get(li);

        return (
          <div key={li} className="flex" style={{ backgroundColor: style.bg }}>
            <span className="w-12 text-right pr-2 text-[var(--text-muted)] select-none border-r border-[var(--border)] flex-shrink-0">
              {line.oldLineNumber ?? ''}
            </span>
            <span className="w-12 text-right pr-2 text-[var(--text-muted)] select-none border-r border-[var(--border)] flex-shrink-0">
              {line.newLineNumber ?? ''}
            </span>
            <span className="w-4 text-center flex-shrink-0" style={{ color: style.fg }}>
              {style.prefix}
            </span>
            <span className="flex-1 px-1 whitespace-pre" style={{ color: style.fg }}>
              {segments
                ? segments.map((seg, si) => (
                    <span key={si} style={seg.changed ? { backgroundColor: style.highlight } : undefined}>
                      {seg.text}
                    </span>
                  ))
                : line.content}
            </span>
          </div>
        );
      })}
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
