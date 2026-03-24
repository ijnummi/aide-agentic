import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { PtyService } from './services/pty.service';
import { ClaudeService } from './services/claude.service';
import { GitService } from './services/git.service';
import { WorktreeService } from './services/worktree.service';
import { GitHubService } from './services/github.service';
import { PersistenceService } from './services/persistence.service';
import Store from 'electron-store';
import { registerAllHandlers } from './ipc/index';
import { detectShell } from './util/shell';
import { getDefaultCwd } from './util/platform';
import { IPC } from '../shared/constants';

if (started) {
  app.quit();
}

const ptyService = new PtyService();
const claudeService = new ClaudeService();
const gitService = new GitService();
const worktreeService = new WorktreeService();
const githubService = new GitHubService();
const persistenceService = new PersistenceService();
const windowStore = new Store<{ bounds: { x: number; y: number; width: number; height: number }; maximized: boolean }>({
  name: 'aide-window',
  defaults: { bounds: { x: undefined as any, y: undefined as any, width: 1400, height: 900 }, maximized: false },
});
let mainWindow: BrowserWindow | null = null;

function getWindow(): BrowserWindow | null {
  return mainWindow;
}

function createWindow() {
  const saved = windowStore.get('bounds');
  const wasMaximized = windowStore.get('maximized');

  mainWindow = new BrowserWindow({
    width: saved.width || 1400,
    height: saved.height || 900,
    x: saved.x,
    y: saved.y,
    minWidth: 800,
    minHeight: 600,
    title: 'AIDE',
    frame: false,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (wasMaximized) {
    mainWindow.maximize();
  }

  mainWindow.removeMenu();

  // Save bounds on move/resize (debounced)
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const saveBounds = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      windowStore.set('maximized', mainWindow.isMaximized());
      if (!mainWindow.isMaximized()) {
        windowStore.set('bounds', mainWindow.getBounds());
      }
    }, 500);
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (process.argv.includes('--devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control handlers
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

// Shell info handler
ipcMain.handle(IPC.SHELL_INFO, () => ({
  shell: detectShell(),
  cwd: getDefaultCwd(),
  env: Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined),
  ) as Record<string, string>,
  platform: process.platform,
}));

// Open external URLs
ipcMain.handle(IPC.OPEN_EXTERNAL, (_event, url: string) => {
  return shell.openExternal(url);
});

// Register IPC handlers
registerAllHandlers(ptyService, claudeService, gitService, worktreeService, githubService, persistenceService, getWindow);

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  ptyService.dispose();
  claudeService.dispose();
});
