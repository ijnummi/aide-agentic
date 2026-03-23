import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getApi } from '../lib/ipc';

const TERM_OPTIONS = {
  cursorBlink: true,
  fontSize: 14,
  fontWeight: '300' as const,
  fontFamily: "'JetBrainsMono Nerd Font Mono', 'JetBrains Mono', Menlo, Monaco, monospace",
  theme: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: '#45475a',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
};

interface CachedTerminal {
  term: Terminal;
  fitAddon: FitAddon;
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
      const term = new Terminal(TERM_OPTIONS);
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

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

      cached = { term, fitAddon, unsubData, unsubExit };
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
