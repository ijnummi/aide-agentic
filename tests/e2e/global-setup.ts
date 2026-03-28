import { execSync, spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const RENDERER_PORT = 5199;

let viteProcess: ChildProcess | null = null;

export default async function globalSetup() {
  // 1. Build preload + main for e2e (preload first — main has emptyOutDir:false)
  execSync('rm -rf .vite/build-e2e', { cwd: PROJECT_ROOT, stdio: 'pipe' });
  execSync('npx vite build --config tests/e2e/vite.e2e-preload.config.ts', {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
  });
  execSync('npx vite build --config tests/e2e/vite.e2e-main.config.ts', {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
  });

  // 2. Start Vite renderer dev server
  viteProcess = spawn(path.join(PROJECT_ROOT, 'node_modules/.bin/vite'), ['--config', 'vite.renderer.config.ts', '--port', String(RENDERER_PORT)], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
  });

  // Wait for Vite to be ready
  await waitForServer(`http://localhost:${RENDERER_PORT}`, 10_000);

  // Store reference for teardown
  (globalThis as any).__viteProcess = viteProcess;
}

export async function globalTeardown() {
  const proc = (globalThis as any).__viteProcess as ChildProcess | undefined;
  if (proc) {
    proc.kill('SIGTERM');
  }
}

async function waitForServer(url: string, timeout: number) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}
