import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DEFAULT_SETTINGS } from '../../shared/settings';
import type {
  ChangeRequest,
  CRType,
  CRStatus,
  CRListResponse,
  CRCreateResponse,
  CRReadSpecResponse,
  CRStartResponse,
  CRApproveResponse,
} from '../../shared/types/change-request';
import type { WorktreeService } from './worktree.service';
import type { GitService } from './git.service';
import type { GitHubService } from './github.service';

const settings = DEFAULT_SETTINGS.changeRequests;

export class ChangeRequestService {
  constructor(
    private worktreeService: WorktreeService,
    private gitService: GitService,
    private githubService: GitHubService,
  ) {}

  private crDir(cwd: string): string {
    return path.join(cwd, settings.storageDir);
  }

  private specPath(cwd: string, crId: string): string {
    return path.join(this.crDir(cwd), crId, settings.specFileName);
  }

  async list(cwd: string): Promise<CRListResponse> {
    const dir = this.crDir(cwd);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return { items: [] };
    }

    const items: ChangeRequest[] = [];
    for (const entry of entries) {
      const specFile = path.join(dir, entry, settings.specFileName);
      try {
        const content = await fs.readFile(specFile, 'utf-8');
        const cr = this.parseSpec(entry, content);
        if (cr) items.push(cr);
      } catch {
        continue;
      }
    }

    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { items };
  }

  async get(cwd: string, crId: string): Promise<ChangeRequest | null> {
    try {
      const content = await fs.readFile(this.specPath(cwd, crId), 'utf-8');
      return this.parseSpec(crId, content);
    } catch {
      return null;
    }
  }

  async create(cwd: string, type: CRType, name: string, description: string): Promise<CRCreateResponse> {
    const crId = `${type}-${name}`;
    const dirPath = path.join(this.crDir(cwd), crId);
    await fs.mkdir(dirPath, { recursive: true });

    const now = new Date().toISOString();
    const branch = crId;
    const spec = this.buildSpec({
      type,
      name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      branch,
    }, `# ${crId}\n\n${description}\n`);

    const specFile = path.join(dirPath, settings.specFileName);
    await fs.writeFile(specFile, spec, 'utf-8');

    const cr: ChangeRequest = {
      id: crId,
      type,
      name,
      status: 'draft',
      description,
      createdAt: now,
      updatedAt: now,
      branch,
    };

    return { cr, specPath: specFile };
  }

  async readSpec(cwd: string, crId: string): Promise<CRReadSpecResponse> {
    const content = await fs.readFile(this.specPath(cwd, crId), 'utf-8');
    return { content };
  }

  async writeSpec(cwd: string, crId: string, content: string): Promise<void> {
    // Update the updatedAt field in frontmatter
    const updated = this.updateFrontmatterField(content, 'updatedAt', new Date().toISOString());
    await fs.writeFile(this.specPath(cwd, crId), updated, 'utf-8');
  }

  async start(cwd: string, crId: string): Promise<CRStartResponse> {
    const cr = await this.get(cwd, crId);
    if (!cr) throw new Error(`Change request '${crId}' not found`);
    if (cr.status !== 'draft' && cr.status !== 'ready') {
      throw new Error(`Cannot start CR with status '${cr.status}'`);
    }

    const projectName = path.basename(cwd);
    const worktreePath = path.resolve(cwd, '..', `${projectName}-${crId}`);

    // Only create worktree if it doesn't already exist (resuming from ready)
    if (cr.status === 'draft') {
      await this.worktreeService.add(cwd, worktreePath, cr.branch, true);
    }

    await this.updateFrontmatter(cwd, crId, {
      status: 'running',
      worktreePath,
    });

    const updated = await this.get(cwd, crId);
    return { cr: updated!, worktreePath };
  }

  async stop(cwd: string, crId: string): Promise<void> {
    const cr = await this.get(cwd, crId);
    if (!cr) throw new Error(`Change request '${crId}' not found`);

    // Stage all changes in the worktree before stopping
    if (cr.worktreePath) {
      try {
        await this.gitService.stage(cr.worktreePath, ['-A']);
      } catch { /* no changes to stage is fine */ }
    }

    await this.updateFrontmatter(cwd, crId, { status: 'ready' });
  }

  async approve(cwd: string, crId: string, strategy: 'merge' | 'pr'): Promise<CRApproveResponse> {
    const cr = await this.get(cwd, crId);
    if (!cr) throw new Error(`Change request '${crId}' not found`);

    // Check that master has no uncommitted changes
    const masterStatus = await this.gitService.status(cwd);
    const hasOpenChanges = masterStatus.staged.length > 0
      || masterStatus.unstaged.length > 0
      || masterStatus.untracked.length > 0;
    if (hasOpenChanges) {
      throw new Error('Master has uncommitted changes. Please commit or stash them before approving.');
    }

    // Commit all changes in the worktree branch
    if (cr.worktreePath) {
      try {
        await this.gitService.stage(cr.worktreePath, ['-A']);
        await this.gitService.commit(cr.worktreePath, `${crId}: implement change request`);
      } catch { /* nothing to commit is fine */ }
    }

    let prNumber: number | undefined;
    let prUrl: string | undefined;

    if (strategy === 'merge') {
      await this.gitService.merge(cwd, cr.branch);
      await this.gitService.deleteBranch(cwd, cr.branch);
    } else {
      await this.gitService.push(cwd, cr.branch, true);
      const specContent = await fs.readFile(this.specPath(cwd, crId), 'utf-8');
      const body = this.extractBody(specContent);
      const result = await this.githubService.createPR(
        cwd, cr.branch, 'master', crId, body,
      );
      prNumber = result.number;
      prUrl = result.url;
    }

    // Remove worktree if it exists
    if (cr.worktreePath) {
      try {
        await this.worktreeService.remove(cwd, cr.worktreePath);
      } catch { /* worktree may already be gone */ }
    }

    const updates: Record<string, string> = {
      status: 'approved',
      worktreePath: '',
      claudeSessionId: '',
    };
    if (prNumber) updates.prNumber = String(prNumber);
    await this.updateFrontmatter(cwd, crId, updates);

    const updated = await this.get(cwd, crId);
    return { cr: updated!, prNumber, prUrl };
  }

  async discard(cwd: string, crId: string): Promise<void> {
    const cr = await this.get(cwd, crId);
    if (!cr) throw new Error(`Change request '${crId}' not found`);

    if (cr.worktreePath) {
      try {
        await this.worktreeService.remove(cwd, cr.worktreePath, true);
      } catch { /* worktree may already be gone */ }
    }

    try {
      await this.gitService.deleteBranch(cwd, cr.branch, true);
    } catch { /* branch may not exist */ }

    await this.updateFrontmatter(cwd, crId, {
      status: 'discarded',
      worktreePath: '',
      claudeSessionId: '',
    });
  }

  async deleteAll(cwd: string): Promise<void> {
    const dir = this.crDir(cwd);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch { /* directory may not exist */ }
  }

  /**
   * Full debug reset: delete all non-main worktrees, their branches, and all CR files.
   * Does NOT touch master branch files.
   */
  async debugReset(cwd: string): Promise<void> {
    // List worktrees and remove non-main ones
    const worktrees = await this.worktreeService.list(cwd);
    for (const wt of worktrees) {
      if (wt.isMain) continue;
      try {
        await this.worktreeService.remove(cwd, wt.path, true);
      } catch { /* already gone */ }
    }

    // Prune stale worktree refs
    try {
      await this.worktreeService.prune(cwd);
    } catch {}

    // Delete all non-main branches
    try {
      const branches = await this.gitService.branches(cwd);
      const mainBranch = (await this.gitService.status(cwd)).branch;
      for (const branch of branches) {
        if (branch === mainBranch) continue;
        try {
          await this.gitService.deleteBranch(cwd, branch, true);
        } catch { /* may fail for checked-out branches */ }
      }
    } catch {}

    // Delete all CR files
    await this.deleteAll(cwd);
  }

  // --- Frontmatter parsing ---

  private parseSpec(crId: string, raw: string): ChangeRequest | null {
    const fm = this.parseFrontmatter(raw);
    if (!fm.type || !fm.name) return null;

    return {
      id: crId,
      type: fm.type as CRType,
      name: fm.name,
      status: (fm.status as CRStatus) || 'draft',
      description: this.extractBody(raw),
      createdAt: fm.createdAt || new Date().toISOString(),
      updatedAt: fm.updatedAt || new Date().toISOString(),
      branch: fm.branch || crId,
      worktreePath: fm.worktreePath || undefined,
      claudeSessionId: fm.claudeSessionId || undefined,
      prNumber: fm.prNumber ? parseInt(fm.prNumber, 10) : undefined,
    };
  }

  private parseFrontmatter(raw: string): Record<string, string> {
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const result: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key && value) result[key] = value;
    }
    return result;
  }

  private extractBody(raw: string): string {
    const match = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
    return match ? match[1].trim() : raw.trim();
  }

  private buildSpec(fm: Record<string, string>, body: string): string {
    const lines = Object.entries(fm)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    return `---\n${lines.join('\n')}\n---\n\n${body}\n`;
  }

  private async updateFrontmatter(cwd: string, crId: string, updates: Record<string, string>): Promise<void> {
    const specFile = this.specPath(cwd, crId);
    let content = await fs.readFile(specFile, 'utf-8');
    updates.updatedAt = new Date().toISOString();
    for (const [key, value] of Object.entries(updates)) {
      content = this.updateFrontmatterField(content, key, value);
    }
    await fs.writeFile(specFile, content, 'utf-8');
  }

  private updateFrontmatterField(raw: string, key: string, value: string): string {
    const fmMatch = raw.match(/^(---\n)([\s\S]*?)(\n---)/);
    if (!fmMatch) return raw;

    const [, open, body, close] = fmMatch;
    const lines = body.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}:`)) {
        if (value) {
          lines[i] = `${key}: ${value}`;
        } else {
          lines.splice(i, 1);
        }
        found = true;
        break;
      }
    }
    if (!found && value) {
      lines.push(`${key}: ${value}`);
    }

    return open + lines.join('\n') + close + raw.slice(fmMatch[0].length);
  }
}
