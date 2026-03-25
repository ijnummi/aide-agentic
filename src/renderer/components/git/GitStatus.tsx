import { GitBranch, RefreshCw, Plus, FileText, Diff } from 'lucide-react';
import { useGitStore } from '../../stores/git.store';
import { useUIStore } from '../../stores/ui.store';
import { IconButton } from '../shared/IconButton';
import { baseName } from '../../lib/path';
import type { FileChange } from '../../../shared/types/git';

function parentDir(filePath: string): string {
  const idx = filePath.lastIndexOf('/');
  return idx > 0 ? filePath.slice(0, idx) : '';
}

interface GitStatusProps {
  onOpenDiff?: (file: string, staged: boolean) => void;
  onOpenAllChanges?: (scrollToFile?: string) => void;
}

const statusColors: Record<FileChange['status'], string> = {
  added: 'var(--success)',
  modified: 'var(--warning)',
  deleted: 'var(--error)',
  renamed: 'var(--accent)',
  copied: 'var(--accent)',
  untracked: 'var(--text-muted)',
};

const statusLetters: Record<FileChange['status'], string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
  copied: 'C',
  untracked: '?',
};

export function GitStatus({ onOpenDiff, onOpenAllChanges }: GitStatusProps) {
  const { branch, ahead, behind, staged, unstaged, untracked, isLoading, refresh, stage } =
    useGitStore();

  const handleStageFile = async (file: string) => {
    await stage([file]);
  };

  const handleStageAll = async () => {
    const allFiles = [...unstaged.map((f) => f.path), ...untracked];
    if (allFiles.length > 0) await stage(allFiles);
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Branch info */}
      <div className="flex items-center gap-2 px-1">
        <GitBranch size={18} className="text-[var(--accent)]" />
        <span className="font-medium">{branch || 'no branch'}</span>
        {(ahead > 0 || behind > 0) && (
          <span className="text-[var(--text-muted)]">
            {ahead > 0 && `+${ahead}`}
            {ahead > 0 && behind > 0 && ' '}
            {behind > 0 && `-${behind}`}
          </span>
        )}
        <div className="flex-1" />
        <IconButton
          icon={RefreshCw}
          size={12}
          title="Refresh"
          onClick={refresh}
          className={isLoading ? 'animate-spin' : ''}
        />
      </div>

      {/* All changes button */}
      {(staged.length > 0 || unstaged.length > 0) && (
        <button
          className="flex items-center gap-2 mx-1 px-2 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          onClick={() => onOpenAllChanges?.()}
        >
          <Diff size={14} />
          <span>All Changes ({staged.length + unstaged.length})</span>
        </button>
      )}

      {/* Staged changes */}
      {staged.length > 0 && (
        <div>
          <div className="flex items-center gap-1 px-1 py-0.5 text-[var(--text-muted)] uppercase tracking-wider">
            Staged ({staged.length})
          </div>
          {staged.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              onClick={(e) => e.ctrlKey ? onOpenDiff?.(file.path, true) : onOpenAllChanges?.(file.path)}
            />
          ))}
        </div>
      )}

      {/* Unstaged changes */}
      {unstaged.length > 0 && (
        <div>
          <div className="flex items-center gap-1 px-1 py-0.5 text-[var(--text-muted)] uppercase tracking-wider">
            Changes ({unstaged.length})
            <div className="flex-1" />
            <IconButton icon={Plus} size={12} title="Stage All" onClick={handleStageAll} />
          </div>
          {unstaged.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              onClick={(e) => e.ctrlKey ? onOpenDiff?.(file.path, false) : onOpenAllChanges?.(file.path)}
              onStage={() => handleStageFile(file.path)}
            />
          ))}
        </div>
      )}

      {/* Untracked */}
      {untracked.length > 0 && (
        <div>
          <div className="flex items-center gap-1 px-1 py-0.5 text-[var(--text-muted)] uppercase tracking-wider">
            Untracked ({untracked.length})
          </div>
          {untracked.map((filePath) => (
            <div
              key={filePath}
              className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[var(--bg-surface)] rounded cursor-pointer"
              onClick={() => handleStageFile(filePath)}
              title={filePath}
            >
              <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />
              <span className="truncate flex-1">
                {baseName(filePath)}
                {parentDir(filePath) && <span className="text-[10px] text-[var(--text-muted)] ml-1.5">{parentDir(filePath)}</span>}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>?</span>
            </div>
          ))}
        </div>
      )}

      {staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && (
        <div className="px-1 text-[var(--text-muted)]">
          Working tree clean
        </div>
      )}
    </div>
  );
}

function FileRow({
  file,
  onClick,
  onStage,
}: {
  file: FileChange;
  onClick?: (e: React.MouseEvent) => void;
  onStage?: () => void;
}) {
  const fileName = baseName(file.path);
  const dir = parentDir(file.path);
  const visibleDiffFile = useUIStore((s) => s.visibleDiffFile);
  const isVisible = visibleDiffFile === file.path;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer group ${
        isVisible ? '' : 'hover:bg-[var(--bg-surface)]'
      }`}
      style={isVisible ? { backgroundColor: 'rgba(137, 180, 250, 0.12)' } : undefined}
      onClick={onClick}
      title={file.path}
    >
      <FileText size={16} style={{ color: statusColors[file.status] }} className="flex-shrink-0" />
      <span className="truncate flex-1">
        {fileName}
        {dir && <span className="text-[10px] text-[var(--text-muted)] ml-1.5">{dir}</span>}
      </span>
      {onStage && (
        <span
          className="opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onStage();
          }}
        >
          <Plus size={12} className="text-[var(--success)]" />
        </span>
      )}
      <span
        className="font-mono w-3 text-center"
        style={{ color: statusColors[file.status] }}
      >
        {statusLetters[file.status]}
      </span>
    </div>
  );
}
