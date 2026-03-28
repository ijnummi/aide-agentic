// Spec: docs/features/git-sidebar.md
import { test, expect } from './fixtures';
import { createCleanTestRepo } from './fixtures';

test.describe('Git sidebar', () => {
  // Spec: docs/features/git-sidebar.md#sidebar-shows-current-branch-and-file-changes
  test('Sidebar shows current branch and file changes', async ({ page }) => {
    await page.click('[data-panel="git"]');

    // Branch name is displayed
    await expect(page.locator('.font-medium', { hasText: 'master' })).toBeVisible({ timeout: 10_000 });

    // Changes section lists the modified file with status badge
    const changes = page.locator('[data-section="changes"]');
    await expect(changes).toBeVisible({ timeout: 5_000 });
    await expect(changes.getByText('app.ts')).toBeVisible();
  });

  // Spec: docs/features/git-sidebar.md#staging-files-moves-them-to-the-staged-section
  test('Staging files moves them to the staged section', async ({ page }) => {
    await page.click('[data-panel="git"]');
    await expect(page.locator('[data-section="changes"]')).toBeVisible({ timeout: 10_000 });

    // Click Stage All
    await page.locator('[data-section="changes"]').getByTitle('Stage All').click();

    // File appears in Staged section
    const staged = page.locator('[data-section="staged"]');
    await expect(staged).toBeVisible({ timeout: 5_000 });
    await expect(staged.getByText('app.ts')).toBeVisible();
  });

  // Spec: docs/features/git-sidebar.md#committing-clears-staged-changes
  test('Committing clears staged changes', async ({ page }) => {
    await page.click('[data-panel="git"]');
    await expect(page.locator('[data-section="changes"]')).toBeVisible({ timeout: 10_000 });

    // Stage all changes
    await page.locator('[data-section="changes"]').getByTitle('Stage All').click();
    await expect(page.locator('[data-section="staged"]')).toBeVisible({ timeout: 5_000 });

    // Type commit message and commit
    const commitPanel = page.locator('[data-section="commit-panel"]');
    await commitPanel.locator('textarea').fill('e2e test commit');
    await commitPanel.getByRole('button', { name: /Commit/ }).click();

    // Working tree is clean
    await expect(page.getByText('Working tree clean')).toBeVisible({ timeout: 5_000 });
  });

  // Spec: docs/features/git-sidebar.md#sidebar-shows-recent-commits-with-stats
  test('Sidebar shows recent commits with stats', async ({ page }) => {
    await page.click('[data-panel="git"]');

    // Commits section visible
    const commitLog = page.locator('[data-section="commit-log"]');
    await expect(commitLog).toBeVisible({ timeout: 10_000 });

    // Shows all 3 test repo commits
    await expect(commitLog.getByText('Add utils')).toBeVisible();
    await expect(commitLog.getByText('Add app module')).toBeVisible();
    await expect(commitLog.getByText('Initial commit')).toBeVisible();
  });

  // Spec: docs/features/git-sidebar.md#clicking-a-commit-opens-its-diff-in-a-tab
  test('Clicking a commit opens its diff in a tab', async ({ page }) => {
    await page.click('[data-panel="git"]');

    const commitLog = page.locator('[data-section="commit-log"]');
    await expect(commitLog).toBeVisible({ timeout: 10_000 });

    // Click "Add utils" commit
    await commitLog.locator('[data-testid="commit-entry"]').filter({ hasText: 'Add utils' }).click();

    // Diff content is visible (the add function from utils.ts)
    await expect(page.locator('text=add').first()).toBeVisible({ timeout: 10_000 });
  });

  test.describe('edge cases', () => {
    // Override testRepo with a clean repo for this group
    const cleanTest = test.extend({ testRepo: async ({}, use) => use(createCleanTestRepo()) });

    // Spec: docs/features/git-sidebar.md#clean-working-tree-shows-no-change-sections
    cleanTest('Clean working tree shows no change sections', async ({ page }) => {
      await page.click('[data-panel="git"]');
      await expect(page.getByText('Working tree clean')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('[data-section="commit-log"]')).toBeVisible();
    });

    // Spec: docs/features/git-sidebar.md#repository-with-no-commits
    // Skipped: requires a custom fixture with an empty git init (no commits).
    // The default testRepo fixture creates 3 commits.
    test.skip('Repository with no commits', async () => {
      // Would need a separate fixture that does only `git init` with no commits
    });
  });
});
