export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: string;
  updatedAt: string;
  headBranch: string;
  baseBranch: string;
  draft: boolean;
  additions: number;
  deletions: number;
  labels: string[];
}

export interface PRDetail extends PullRequest {
  body: string;
  mergeable: boolean | null;
  checksStatus: 'pending' | 'success' | 'failure' | 'unknown';
  reviewDecision: string | null;
  comments: PRComment[];
}

export interface PRComment {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  path?: string;
  line?: number;
}

export interface GitHubAuthRequest {
  token: string;
}

export interface GitHubPRsRequest {
  cwd: string;
  state?: 'open' | 'closed' | 'all';
}

export interface GitHubPRDetailRequest {
  cwd: string;
  number: number;
}

export interface GitHubPRReviewRequest {
  cwd: string;
  number: number;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body: string;
}

export interface GitHubPRCommentRequest {
  cwd: string;
  number: number;
  body: string;
  path?: string;
  line?: number;
}
