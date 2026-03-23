import { useEffect } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import '../../styles/xterm.css';

interface TerminalPanelProps {
  terminalId: string;
  isActive?: boolean;
}

export function TerminalPanel({ terminalId, isActive }: TerminalPanelProps) {
  const { containerRef, focus, fit } = useTerminal({ terminalId });

  useEffect(() => {
    if (isActive) {
      focus();
      fit();
    }
  }, [isActive, focus, fit]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ backgroundColor: '#1e1e2e' }}
    />
  );
}
