import { Bug, Sparkles, Play, Square, Check, Trash2, Eye, Pencil } from 'lucide-react';
import type { ChangeRequest, CRStatus } from '../../../shared/types/change-request';

interface CRCardProps {
  cr: ChangeRequest;
  onEditSpec: (crId: string) => void;
  onStart: (crId: string) => void;
  onStop: (crId: string) => void;
  onApprove: (crId: string) => void;
  onDiscard: (crId: string) => void;
  onView: (crId: string) => void;
}

const statusColors: Record<CRStatus, string> = {
  draft: 'var(--text-muted)',
  running: 'var(--accent)',
  ready: 'var(--success)',
  approved: 'var(--success)',
  discarded: 'var(--text-muted)',
};

const statusLabels: Record<CRStatus, string> = {
  draft: 'Draft',
  running: 'Running',
  ready: 'Ready',
  approved: 'Approved',
  discarded: 'Discarded',
};

export function CRCard({ cr, onEditSpec, onStart, onStop, onApprove, onDiscard, onView }: CRCardProps) {
  const TypeIcon = cr.type === 'bug' ? Bug : Sparkles;

  return (
    <div className="flex flex-col gap-1 px-2 py-2 rounded hover:bg-[var(--bg-surface)] group">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${cr.status === 'running' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: statusColors[cr.status] }}
        />
        <TypeIcon size={14} className="text-[var(--text-muted)] flex-shrink-0" />
        <span className="text-sm text-[var(--text-primary)] truncate flex-1">{cr.id}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{statusLabels[cr.status]}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
        {cr.status === 'draft' && (
          <>
            <ActionBtn icon={Pencil} label="Edit Spec" onClick={() => onEditSpec(cr.id)} />
            <ActionBtn icon={Play} label="Start" onClick={() => onStart(cr.id)} />
          </>
        )}
        {cr.status === 'running' && (
          <>
            <ActionBtn icon={Eye} label="View" onClick={() => onView(cr.id)} />
            <ActionBtn icon={Square} label="Stop" onClick={() => onStop(cr.id)} />
          </>
        )}
        {cr.status === 'ready' && (
          <>
            <ActionBtn icon={Pencil} label="Edit Spec" onClick={() => onEditSpec(cr.id)} />
            <ActionBtn icon={Play} label="Resume" onClick={() => onStart(cr.id)} />
            <ActionBtn icon={Check} label="Approve" onClick={() => onApprove(cr.id)} />
            <ActionBtn icon={Trash2} label="Discard" onClick={() => onDiscard(cr.id)} />
          </>
        )}
        {(cr.status === 'approved' || cr.status === 'discarded') && (
          <ActionBtn icon={Eye} label="View Spec" onClick={() => onEditSpec(cr.id)} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]"
      onClick={onClick}
      title={label}
    >
      <Icon size={11} />
      <span>{label}</span>
    </button>
  );
}
