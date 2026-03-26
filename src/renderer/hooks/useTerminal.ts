import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { getApi } from '../lib/ipc';
import { getSettings } from '../stores/settings.store';

function getTermOptions() {
  const s = getSettings();
  return {
    cursorBlink: s.terminal.cursorBlink,
    fontSize: s.font.terminalSize,
    fontWeight: s.font.terminalWeight as '300',
    fontWeightBold: s.font.terminalBoldWeight as '500',
    fontFamily: s.font.family,
    scrollback: s.terminal.scrollback,
    theme: s.terminal.theme,
  };
}

interface CachedTerminal {
  term: Terminal;
  fitAddon: FitAddon;
  serializeAddon: SerializeAddon;
  unsubData: () => void;
  unsubExit: () => void;
}

// Global cache: keeps Terminal instances alive across tab switches
const terminalCache = new Map<string, CachedTerminal>();

export function getTerminalCache() {
  return terminalCache;
}

interface UseTerminalOptions {
  terminalId: string;
}

export function useTerminal({ terminalId }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const attach = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    let cached = terminalCache.get(terminalId);

    if (!cached) {
      // First mount: create Terminal + wire IPC (PTY already created by terminal store)
      const term = new Terminal(getTermOptions());
      const fitAddon = new FitAddon();
      const serializeAddon = new SerializeAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(serializeAddon);
      term.loadAddon(new WebLinksAddon());

      // Let app-level shortcuts pass through instead of being consumed by xterm
      term.attachCustomKeyEventHandler((e) => {
        if (e.type !== 'keydown') return true;
        // Ctrl+P — quick switcher
        if (e.ctrlKey && !e.shiftKey && e.key === 'p') return false;
        // Ctrl+Shift+P — command palette
        if (e.ctrlKey && e.shiftKey && e.key === 'P') return false;
        // Ctrl+B — toggle sidebar
        if (e.ctrlKey && !e.shiftKey && e.key === 'b') return false;
        // Ctrl+T — new terminal
        if (e.ctrlKey && !e.shiftKey && e.key === 't') return false;
        // Ctrl+Shift+C — new Claude session
        if (e.ctrlKey && e.shiftKey && e.key === 'C') return false;
        // Ctrl+Tab / Ctrl+Shift+Tab — tab switcher
        if (e.ctrlKey && e.key === 'Tab') return false;
        // Alt+Arrow — pane/tab navigation
        if (e.altKey && !e.ctrlKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return false;
        // Alt+1-0 — focus tab by number
        if (e.altKey && !e.ctrlKey && e.key >= '0' && e.key <= '9') return false;
        // Ctrl+\ / Ctrl+Shift+\ — split pane
        if (e.ctrlKey && e.code === 'Backslash') return false;
        // Ctrl+Shift+Left/Right — switch worktree
        if (e.ctrlKey && e.shiftKey && !e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return false;
        // Ctrl+Shift+Alt+Arrow — split in direction
        if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) return false;
        return true;
      });

      // Send user input to existing PTY
      term.onData((data) => {
        getApi().pty.write({ id: terminalId, data });
      });

      // Receive PTY output
      const unsubData = getApi().pty.onData((event) => {
        if (event.id === terminalId) {
          term.write(event.data);
        }
      });

      const unsubExit = getApi().pty.onExit((event) => {
        if (event.id === terminalId) {
          term.write(`\r\n\x1b[90m[Process exited with code ${event.exitCode}]\x1b[0m\r\n`);
        }
      });

      // Send resize to PTY
      term.onResize(({ cols, rows }) => {
        getApi().pty.resize({ id: terminalId, cols, rows });
      });

      cached = { term, fitAddon, serializeAddon, unsubData, unsubExit };
      terminalCache.set(terminalId, cached);

      // Open into DOM for the first time
      term.open(container);
    } else {
      // Re-mount: re-attach existing Terminal to new DOM container
      // xterm.js doesn't have a public re-attach API, so we move the element
      const xtermEl = cached.term.element;
      if (xtermEl && xtermEl.parentElement !== container) {
        container.appendChild(xtermEl);
      }
    }

    // Fit after attach
    requestAnimationFrame(() => {
      cached!.fitAddon.fit();
    });

    // Observe container resizes
    observerRef.current = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        const c = terminalCache.get(terminalId);
        if (c) c.fitAddon.fit();
      });
    });
    observerRef.current.observe(container);
  }, [terminalId]);

  useEffect(() => {
    attach();
    return () => {
      // On unmount: disconnect observer but keep Terminal alive in cache
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [attach]);

  const focus = useCallback(() => {
    terminalCache.get(terminalId)?.term.focus();
  }, [terminalId]);

  const fit = useCallback(() => {
    terminalCache.get(terminalId)?.fitAddon.fit();
  }, [terminalId]);

  return { containerRef, focus, fit };
}

/** Get serialized scrollback for persistence */
export function getTerminalScrollback(terminalId: string): string {
  const cached = terminalCache.get(terminalId);
  if (!cached) return '';
  try {
    return cached.serializeAddon.serialize();
  } catch {
    return '';
  }
}

/** Write serialized scrollback to restore visual state */
export function writeTerminalScrollback(terminalId: string, scrollback: string): void {
  const cached = terminalCache.get(terminalId);
  if (cached && scrollback) {
    cached.term.write(scrollback);
  }
}

/** Call when a terminal is permanently closed (killed) */
export function disposeTerminal(terminalId: string) {
  const cached = terminalCache.get(terminalId);
  if (cached) {
    cached.unsubData();
    cached.unsubExit();
    cached.term.dispose();
    terminalCache.delete(terminalId);
  }
}

/**
 * Register a global listener that auto-closes tabs when PTY exits.
 * Call once at app startup.
 */
let exitListenerRegistered = false;

export function registerTerminalExitListener(
  findAndRemoveTab: (terminalId: string) => void,
) {
  if (exitListenerRegistered) return;
  exitListenerRegistered = true;

  getApi().pty.onExit((event) => {
    // Small delay so the exit message is visible briefly
    setTimeout(() => {
      disposeTerminal(event.id);
      findAndRemoveTab(event.id);
    }, 300);
  });
}
