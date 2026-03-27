import { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';
import { Bug, Sparkles, Play, Square, Check, Trash2 } from 'lucide-react';
import { getApi } from '../../lib/ipc';
import { useChangeRequestStore } from '../../stores/change-request.store';
import { useDocPreviewStore } from '../../stores/docpreview.store';
import { useGitStore } from '../../stores/git.store';
import type { ChangeRequest, CRStatus } from '../../../shared/types/change-request';
import type { editor } from 'monaco-editor';

interface CRSpecViewerProps {
  crId: string;
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

export function CRSpecViewer({ crId }: CRSpecViewerProps) {
  const tabId = `cr:${crId}`;
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const savedContentRef = useRef<string>('');
  const saveRef = useRef<() => Promise<void>>(undefined);

  const cwd = useChangeRequestStore((s) => s.cwd);
  const items = useChangeRequestStore((s) => s.items);
  const startCR = useChangeRequestStore((s) => s.start);
  const stopCR = useChangeRequestStore((s) => s.stop);
  const approveCR = useChangeRequestStore((s) => s.approve);
  const discardCR = useChangeRequestStore((s) => s.discard);
  const gitRefresh = useGitStore((s) => s.refresh);

  const cr = items.find((c) => c.id === crId);
  const preview = useDocPreviewStore((s) => s.previews.get(tabId) ?? false);
  const togglePreview = useDocPreviewStore((s) => s.toggle);

  useEffect(() => {
    if (!cwd || !crId) return;
    setContent(null);
    setError(null);
    setDirty(false);
    getApi()
      .cr.readSpec({ cwd, crId })
      .then((res) => {
        setContent(res.content);
        savedContentRef.current = res.content;
      })
      .catch((err) => setError(err?.message || 'Failed to read spec'));
  }, [cwd, crId]);

  const handleSave = useCallback(async () => {
    if (content === null || !cwd) return;
    try {
      await getApi().cr.writeSpec({ cwd, crId, content });
      savedContentRef.current = content;
      setDirty(false);
      gitRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
  }, [cwd, crId, content, gitRefresh]);

  saveRef.current = handleSave;

  const handleEditorMount: OnMount = useCallback((ed, monaco) => {
    editorRef.current = ed;
    ed.addAction({
      id: 'aide.saveFile',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => { saveRef.current?.(); },
    });
    ed.addAction({
      id: 'aide.togglePreview',
      label: 'Toggle Markdown Preview',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: () => { togglePreview(tabId); },
    });
    ed.focus();
  }, [tabId, togglePreview]);

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setDirty(value !== savedContentRef.current);
    }
  }, []);

  const TypeIcon = cr?.type === 'bug' ? Bug : Sparkles;
  const editable = cr?.status === 'draft' || cr?.status === 'ready';

  return (
    <div className="flex flex-col h-full">
      {/* CR toolbar */}
      <div className="flex items-center gap-2 px-3 h-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs select-none">
        {cr && <TypeIcon size={14} className="text-[var(--text-muted)]" />}
        <span className="text-[var(--text-secondary)] font-medium">{crId}</span>
        {cr && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ backgroundColor: statusColors[cr.status], color: 'var(--bg-primary)' }}
          >
            {statusLabels[cr.status]}
          </span>
        )}
        {dirty && <span className="text-[var(--warning)] text-[10px]">modified</span>}
        <div className="flex-1" />

        {dirty && (
          <button
            className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-[var(--bg-primary)]"
            onClick={handleSave}
          >
            Save
          </button>
        )}

        {cr?.status === 'draft' && (
          <ToolbarBtn icon={Play} label="Start" onClick={() => startCR(crId)} />
        )}
        {cr?.status === 'running' && (
          <ToolbarBtn icon={Square} label="Stop" onClick={() => stopCR(crId)} />
        )}
        {cr?.status === 'ready' && (
          <>
            <ToolbarBtn icon={Play} label="Resume" onClick={() => startCR(crId)} />
            <ToolbarBtn icon={Check} label="Approve" onClick={() => approveCR(crId, 'merge')} />
            <ToolbarBtn icon={Trash2} label="Discard" onClick={() => discardCR(crId)} />
          </>
        )}

        <button
          className={`px-1.5 py-0.5 rounded text-[10px] ${
            preview
              ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => togglePreview(tabId)}
          title="Toggle preview (Ctrl+Shift+V)"
        >
          {preview ? 'Preview' : 'Edit'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
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
        {content !== null && !preview && (
          <Editor
            value={content}
            language="markdown"
            theme="vs-dark"
            onChange={editable ? handleChange : undefined}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              fontSize: 14,
              scrollBeyondLastLine: false,
              renderLineHighlight: 'line',
              padding: { top: 8 },
              automaticLayout: true,
              readOnly: !editable,
            }}
          />
        )}
        {content !== null && preview && (
          <div className="h-full overflow-auto">
            <div className="markdown-body !py-4 !px-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]"
      onClick={onClick}
      title={label}
    >
      <Icon size={11} />
      <span>{label}</span>
    </button>
  );
}
