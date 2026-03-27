import { Octokit } from '@octokit/rest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PullRequest, PRDetail, PRComment } from '../../shared/types/github';

const exec = promisify(execFile);

export class GitHubService {
  private octokit: Octokit | null = null;
  private repoCache = new Map<string, { owner: string; repo: string }>();

  authenticate(token: string): void {
    this.octokit = new Octokit({ auth: token });
  }

  isAuthenticated(): boolean {
    return this.octokit !== null;
  }

  private async getRepo(cwd: string): Promise<{ owner: string; repo: string }> {
    const cached = this.repoCache.get(cwd);
    if (cached) return cached;

    const { stdout } = await exec('git', ['remote', 'get-url', 'origin'], { cwd });
    const url = stdout.trim();

    // Parse GitHub URL: git@github.com:owner/repo.git or https://github.com/owner/repo.git
    let match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) throw new Error(`Cannot parse GitHub remote: ${url}`);

    const result = { owner: match[1], repo: match[2] };
    this.repoCache.set(cwd, result);
    return result;
  }

  async listPRs(cwd: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);

    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: state === 'all' ? 'all' : state,
      sort: 'updated',
      direction: 'desc',
      per_page: 30,
    });

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
      author: pr.user?.login || '',
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      draft: pr.draft || false,
      additions: 0,
      deletions: 0,
      labels: pr.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
    }));
  }

  async getPRDetail(cwd: string, number: number): Promise<PRDetail> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);

    const [{ data: pr }, { data: comments }] = await Promise.all([
      this.octokit.pulls.get({ owner, repo, pull_number: number }),
      this.octokit.issues.listComments({ owner, repo, issue_number: number }),
    ]);

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
      author: pr.user?.login || '',
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      draft: pr.draft || false,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      labels: pr.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
      mergeable: pr.mergeable,
      checksStatus: 'unknown',
      reviewDecision: null,
      comments: comments.map((c) => ({
        id: c.id,
        author: c.user?.login || '',
        body: c.body || '',
        createdAt: c.created_at,
      })),
    };
  }

  async getPRDiff(cwd: string, number: number): Promise<string> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);

    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: number,
      mediaType: { format: 'diff' },
    });

    return data as unknown as string;
  }

  async submitReview(
    cwd: string,
    number: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string,
  ): Promise<void> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);

    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: number,
      event,
      body,
    });
  }

  async createPR(
    cwd: string,
    head: string,
    base: string,
    title: string,
    body: string,
  ): Promise<{ number: number; url: string }> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);
    const { data } = await this.octokit.pulls.create({
      owner, repo, head, base, title, body,
    });
    return { number: data.number, url: data.html_url };
  }

  async addComment(cwd: string, number: number, body: string): Promise<void> {
    if (!this.octokit) throw new Error('Not authenticated');
    const { owner, repo } = await this.getRepo(cwd);

    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body,
    });
  }
}
