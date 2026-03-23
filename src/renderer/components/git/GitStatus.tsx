import { GitBranch, RefreshCw, Plus, Minus, FileText } from 'lucide-react';
import { useGitStore } from '../../stores/git.store';
import { IconButton } from '../shared/IconButton';
import type { FileChange } from '../../../shared/types/git';

interface GitStatusProps {
  onOpenDiff?: (file: string, staged: boolean) => void;
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

export function GitStatus({ onOpenDiff }: GitStatusProps) {
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
    <div className="flex flex-col gap-2 text-xs">
      {/* Branch info */}
      <div className="flex items-center gap-2 px-1">
        <GitBranch size={14} className="text-[var(--accent)]" />
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
              onClick={() => onOpenDiff?.(file.path, true)}
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
              onClick={() => onOpenDiff?.(file.path, false)}
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
          {untracked.map((path) => (
            <div
              key={path}
              className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[var(--bg-surface)] rounded cursor-pointer"
              onClick={() => handleStageFile(path)}
            >
              <FileText size={12} className="text-[var(--text-muted)]" />
              <span className="truncate flex-1">{path}</span>
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
  onClick?: () => void;
  onStage?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[var(--bg-surface)] rounded cursor-pointer group"
      onClick={onClick}
    >
      <FileText size={12} style={{ color: statusColors[file.status] }} />
      <span className="truncate flex-1">{file.path}</span>
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
