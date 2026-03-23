import { useState } from 'react';
import { GitBranch, ChevronDown } from 'lucide-react';
import { useGitStore } from '../../stores/git.store';

export function BranchSelector() {
  const { branch, branches, checkout, refreshBranches } = useGitStore();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    refreshBranches();
    setOpen(!open);
  };

  const handleSelect = async (b: string) => {
    setOpen(false);
    if (b !== branch) {
      await checkout(b);
    }
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-[var(--bg-surface)] transition-colors"
        onClick={handleOpen}
      >
        <GitBranch size={12} />
        <span>{branch || 'no branch'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--border)] rounded shadow-lg min-w-[160px] max-h-48 overflow-y-auto">
            {branches.map((b) => (
              <button
                key={b}
                className={`flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-overlay)] ${
                  b === branch ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                }`}
                onClick={() => handleSelect(b)}
              >
                {b === branch && <GitBranch size={12} />}
                {b !== branch && <span className="w-3" />}
                {b}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
