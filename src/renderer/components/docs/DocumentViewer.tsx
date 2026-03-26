import { useEffect, useState } from 'react';
import { getApi } from '../../lib/ipc';
import { baseName } from '../../lib/path';

interface DocumentViewerProps {
  filePath: string;
  relativePath: string;
}

export function DocumentViewer({ filePath, relativePath }: DocumentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    getApi()
      .docs.readFile({ filePath })
      .then((res) => setContent(res.content))
      .catch((err) => setError(err?.message || 'Failed to read file'));
  }, [filePath]);

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 h-7 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] select-none">
        <span className="text-[var(--text-secondary)] font-medium">{baseName(filePath)}</span>
        {relativePath !== baseName(filePath) && (
          <span className="truncate">{relativePath}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {content === null && !error && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            Loading...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-[var(--error)] text-sm">
            {error}
          </div>
        )}
        {content !== null && (
          <div className="p-4 text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
