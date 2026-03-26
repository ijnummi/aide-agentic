import { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';
import { getApi } from '../../lib/ipc';
import { baseName } from '../../lib/path';
import type { editor } from 'monaco-editor';

interface DocumentViewerProps {
  filePath: string;
  relativePath: string;
}

function languageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    md: 'markdown',
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    css: 'css',
    html: 'html',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
  };
  return map[ext || ''] || 'plaintext';
}

export function DocumentViewer({ filePath, relativePath }: DocumentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const savedContentRef = useRef<string>('');
  const saveRef = useRef<() => Promise<void>>(undefined);
  const isMarkdown = filePath.endsWith('.md');

  useEffect(() => {
    setContent(null);
    setError(null);
    setDirty(false);
    setPreview(false);
    getApi()
      .docs.readFile({ filePath })
      .then((res) => {
        setContent(res.content);
        savedContentRef.current = res.content;
      })
      .catch((err) => setError(err?.message || 'Failed to read file'));
  }, [filePath]);

  const handleSave = useCallback(async () => {
    if (content === null) return;
    try {
      await getApi().docs.writeFile({ filePath, content });
      savedContentRef.current = content;
      setDirty(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
  }, [filePath, content]);

  saveRef.current = handleSave;

  const handleEditorMount: OnMount = useCallback((ed, monaco) => {
    editorRef.current = ed;

    // Ctrl+S — save file
    ed.addAction({
      id: 'aide.saveFile',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => { saveRef.current?.(); },
    });

    // Ctrl+Shift+V — toggle markdown preview
    ed.addAction({
      id: 'aide.togglePreview',
      label: 'Toggle Markdown Preview',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: () => { setPreview((p) => !p); },
    });
  }, []);

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setDirty(value !== savedContentRef.current);
    }
  }, []);

  // Preview-mode keyboard handler (no Monaco editor to catch keys)
  const handlePreviewKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && !e.shiftKey && e.key === 's') {
      e.preventDefault();
      saveRef.current?.();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'V' && isMarkdown) {
      e.preventDefault();
      setPreview((p) => !p);
    }
  }, [isMarkdown]);

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 h-7 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] select-none">
        <span className="text-[var(--text-secondary)] font-medium">{baseName(filePath)}</span>
        {dirty && <span className="text-[var(--warning)]">modified</span>}
        {relativePath !== baseName(filePath) && (
          <span className="truncate">{relativePath}</span>
        )}
        <div className="flex-1" />
        {dirty && (
          <button
            className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-[var(--bg-primary)]"
            onClick={handleSave}
            title="Save (Ctrl+S)"
          >
            Save
          </button>
        )}
        {isMarkdown && (
          <button
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              preview
                ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setPreview((p) => !p)}
            title="Toggle markdown preview (Ctrl+Shift+V)"
          >
            {preview ? 'Preview' : 'Edit'}
          </button>
        )}
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
            language={languageFromPath(filePath)}
            theme="vs-dark"
            onChange={handleChange}
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
            }}
          />
        )}
        {content !== null && preview && (
          <div
            className="h-full overflow-auto"
            tabIndex={0}
            onKeyDown={handlePreviewKeyDown}
          >
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
