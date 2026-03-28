import { test as base, _electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ELECTRON_BIN = path.join(PROJECT_ROOT, 'node_modules/electron/dist/electron');
const MAIN_JS = path.join(PROJECT_ROOT, '.vite/build-e2e/main.js');

/**
 * Creates a temp directory initialized as a git repo with some commits.
 * Returns the path to use as cwd for the test.
 */
export function createTestRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'aide-e2e-'));

  execSync('git init', { cwd: dir });
  execSync('git config user.email "test@test.com"', { cwd: dir });
  execSync('git config user.name "Test User"', { cwd: dir });

  // Initial commit
  writeFileSync(path.join(dir, 'README.md'), '# Test Project\n');
  execSync('git add -A && git commit -m "Initial commit"', { cwd: dir });

  // Second commit
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  writeFileSync(path.join(dir, 'src/app.ts'), 'export const app = true;\n');
  execSync('git add -A && git commit -m "Add app module"', { cwd: dir });

  // Third commit
  writeFileSync(path.join(dir, 'src/utils.ts'), 'export function add(a: number, b: number) { return a + b; }\n');
  execSync('git add -A && git commit -m "Add utils"', { cwd: dir });

  // Leave an unstaged change so there's something in the git status
  writeFileSync(path.join(dir, 'src/app.ts'), 'export const app = true;\nexport const version = "1.0";\n');

  return dir;
}

/** Creates a temp git repo with 3 commits and a clean working tree (no unstaged changes). */
export function createCleanTestRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'aide-e2e-clean-'));

  execSync('git init', { cwd: dir });
  execSync('git config user.email "test@test.com"', { cwd: dir });
  execSync('git config user.name "Test User"', { cwd: dir });

  writeFileSync(path.join(dir, 'README.md'), '# Test Project\n');
  execSync('git add -A && git commit -m "Initial commit"', { cwd: dir });

  mkdirSync(path.join(dir, 'src'), { recursive: true });
  writeFileSync(path.join(dir, 'src/app.ts'), 'export const app = true;\n');
  execSync('git add -A && git commit -m "Add app module"', { cwd: dir });

  writeFileSync(path.join(dir, 'src/utils.ts'), 'export function add(a: number, b: number) { return a + b; }\n');
  execSync('git add -A && git commit -m "Add utils"', { cwd: dir });

  return dir;
}

type TestFixtures = {
  electronApp: ElectronApplication;
  page: Page;
  testRepo: string;
  cleanTestRepo: string;
};

export const test = base.extend<TestFixtures>({
  testRepo: async ({}, use) => {
    const dir = createTestRepo();
    await use(dir);
  },

  cleanTestRepo: async ({}, use) => {
    const dir = createCleanTestRepo();
    await use(dir);
  },

  electronApp: async ({ testRepo }, use) => {
    const app = await _electron.launch({
      executablePath: ELECTRON_BIN,
      args: [MAIN_JS],
      cwd: testRepo,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Log main process console for debugging
    app.process().stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error('[electron]', msg);
    });

    await use(app);
    await app.close();
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    // Log renderer console for debugging
    page.on('console', (msg) => console.log('[renderer]', msg.text()));
    page.on('pageerror', (err) => console.error('[renderer error]', err.message));
    // Wait for the app to fully render
    await page.waitForSelector('[data-theme]', { timeout: 15_000 });
    await use(page);
  },
});

export { expect } from '@playwright/test';
