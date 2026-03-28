import { useState, useMemo, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useChangeRequestStore, type CRFilter } from '../../stores/change-request.store';
import { useLayoutStore } from '../../stores/layout.store';
import { startCR, stopCR, approveCR, discardCR } from '../../lib/cr-orchestration';
import { CRCard } from './CRCard';
import { CreateCRDialog } from './CreateCRDialog';
import { IconButton } from '../shared/IconButton';
import type { CRType, CRStatus } from '../../../shared/types/change-request';
import type { TabItem } from '../../../shared/types/layout';

const filterLabels: Record<CRFilter, string> = {
  active: 'Active',
  approved: 'Approved',
  discarded: 'Discarded',
  all: 'All',
};

const filterStatuses: Record<CRFilter, CRStatus[] | null> = {
  active: ['draft', 'running', 'ready'],
  approved: ['approved'],
  discarded: ['discarded'],
  all: null,
};

export function CRPanel() {
  const items = useChangeRequestStore((s) => s.items);
  const filter = useChangeRequestStore((s) => s.filter);
  const setFilter = useChangeRequestStore((s) => s.setFilter);
  const isLoading = useChangeRequestStore((s) => s.isLoading);
  const refresh = useChangeRequestStore((s) => s.refresh);
  const createFromStore = useChangeRequestStore((s) => s.create);
  const addTab = useLayoutStore((s) => s.addTab);
  const focusOrAddTab = useLayoutStore((s) => s.focusOrAddTab);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const allowed = filterStatuses[filter];
    if (!allowed) return items;
    return items.filter((cr) => allowed.includes(cr.status));
  }, [items, filter]);

  const handleCreate = useCallback(async (type: CRType, name: string, description: string) => {
    const result = await createFromStore(type, name, description);
    const tab: TabItem = {
      id: `cr:${result.cr.id}`,
      type: 'cr-spec',
      title: result.cr.id,
      metadata: { crId: result.cr.id },
    };
    addTab(activePaneId, tab);
  }, [createFromStore, addTab, activePaneId]);

  const handleEditSpec = useCallback((crId: string) => {
    const tab: TabItem = {
      id: `cr:${crId}`,
      type: 'cr-spec',
      title: crId,
      metadata: { crId },
    };
    focusOrAddTab(activePaneId, tab);
  }, [focusOrAddTab, activePaneId]);

  const handleStart = useCallback(async (crId: string) => {
    await startCR(crId);
  }, []);

  const handleStop = useCallback(async (crId: string) => {
    await stopCR(crId);
  }, []);

  const handleApprove = useCallback(async (crId: string) => {
    await approveCR(crId, 'merge');
  }, []);

  const handleDiscard = useCallback(async (crId: string) => {
    await discardCR(crId);
  }, []);

  const handleView = useCallback((crId: string) => {
    handleEditSpec(crId);
  }, [handleEditSpec]);

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Filter tabs + actions */}
      <div className="flex items-center gap-1">
        {(Object.keys(filterLabels) as CRFilter[]).map((f) => (
          <button
            key={f}
            className={`px-2 py-0.5 rounded text-[10px] ${
              filter === f
                ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
            }`}
            onClick={() => setFilter(f)}
          >
            {filterLabels[f]}
          </button>
        ))}
        <div className="flex-1" />
        <IconButton
          icon={RefreshCw}
          size={12}
          title="Refresh"
          onClick={refresh}
          className={isLoading ? 'animate-spin' : ''}
        />
        <IconButton
          icon={Plus}
          size={12}
          title="New Change Request"
          onClick={() => setShowCreate(true)}
        />
      </div>

      {/* List */}
      {filtered.map((cr) => (
        <CRCard
          key={cr.id}
          cr={cr}
          onEditSpec={handleEditSpec}
          onStart={handleStart}
          onStop={handleStop}
          onApprove={handleApprove}
          onDiscard={handleDiscard}
          onView={handleView}
        />
      ))}

      {filtered.length === 0 && !isLoading && (
        <div className="px-2 text-xs text-[var(--text-muted)]">
          {filter === 'active' ? 'No active change requests' : `No ${filter} change requests`}
        </div>
      )}

      {showCreate && (
        <CreateCRDialog
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
