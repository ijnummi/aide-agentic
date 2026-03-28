import { test, expect } from './fixtures';

test.describe('Git sidebar', () => {
  test('shows branch name and file changes', async ({ page }) => {
    // Open git sidebar panel
    await page.click('[data-panel="git"]');
    await page.waitForSelector('text=master', { timeout: 10_000 });

    // Branch should be visible (test repo is on master/main)
    const branchText = await page.textContent('.text-\\[var\\(--accent\\)\\] + span');
    expect(branchText).toBeTruthy();

    // Unstaged change (src/app.ts) should be visible
    await expect(page.locator('text=app.ts')).toBeVisible({ timeout: 5_000 });
  });

  test('stages a file', async ({ page }) => {
    await page.click('[data-panel="git"]');
    await page.waitForSelector('text=app.ts', { timeout: 10_000 });

    // Find the Changes section and click stage-all button
    const stageAllButton = page.locator('text=Changes').locator('..').getByTitle('Stage All');
    await stageAllButton.click();

    // File should now appear in Staged section (match the heading, not "Commit (N staged)")
    await expect(page.getByText(/^Staged \(\d+\)$/)).toBeVisible({ timeout: 5_000 });
  });

  test('commits staged changes', async ({ page }) => {
    await page.click('[data-panel="git"]');
    await page.waitForSelector('text=app.ts', { timeout: 10_000 });

    // Stage changes
    const stageAllButton = page.locator('text=Changes').locator('..').getByTitle('Stage All');
    await stageAllButton.click();
    await expect(page.getByText(/^Staged \(\d+\)$/)).toBeVisible({ timeout: 5_000 });

    // Type commit message and commit
    await page.fill('textarea[placeholder="Commit message..."]', 'e2e test commit');
    await page.click('button:has-text("Commit")');

    // After commit, working tree should be clean
    await expect(page.locator('text=Working tree clean')).toBeVisible({ timeout: 5_000 });
  });

  test('shows commit log with recent commits', async ({ page }) => {
    await page.click('[data-panel="git"]');

    // Wait for commit log to appear
    await expect(page.locator('text=Commits')).toBeVisible({ timeout: 10_000 });

    // Should show at least the commits from the test repo
    await expect(page.locator('text=Add utils')).toBeVisible();
    await expect(page.locator('text=Add app module')).toBeVisible();
    await expect(page.locator('text=Initial commit')).toBeVisible();
  });

  test('clicking a commit opens a diff tab', async ({ page }) => {
    await page.click('[data-panel="git"]');

    // Wait for commit log
    await expect(page.locator('text=Commits')).toBeVisible({ timeout: 10_000 });

    // Click on "Add utils" commit
    await page.locator('text=Add utils').click();

    // The diff viewer should show content from that commit (additions with +)
    await expect(page.locator('text=add').first()).toBeVisible({ timeout: 10_000 });
  });
});
