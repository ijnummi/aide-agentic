export type {
  PtyCreateRequest,
  PtyCreateResponse,
  PtyWriteRequest,
  PtyResizeRequest,
  PtyKillRequest,
  PtyDataEvent,
  PtyExitEvent,
} from './terminal';

export interface ShellInfo {
  shell: string;
  cwd: string;
  env: Record<string, string>;
  platform: NodeJS.Platform;
}
