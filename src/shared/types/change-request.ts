export type CRType = 'bug' | 'feature';
export type CRStatus = 'draft' | 'running' | 'ready' | 'approved' | 'discarded';

export interface ChangeRequest {
  id: string;
  type: CRType;
  name: string;
  status: CRStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  worktreePath?: string;
  branch: string;
  claudeSessionId?: string;
  prNumber?: number;
}

export interface CRListRequest { cwd: string }
export interface CRListResponse { items: ChangeRequest[] }

export interface CRCreateRequest {
  cwd: string;
  type: CRType;
  name: string;
  description: string;
}
export interface CRCreateResponse { cr: ChangeRequest; specPath: string }

export interface CRGetRequest { cwd: string; crId: string }

export interface CRReadSpecRequest { cwd: string; crId: string }
export interface CRReadSpecResponse { content: string }

export interface CRWriteSpecRequest { cwd: string; crId: string; content: string }

export interface CRStartRequest { cwd: string; crId: string }
export interface CRStartResponse { cr: ChangeRequest; worktreePath: string }

export interface CRStopRequest { cwd: string; crId: string }

export interface CRApproveRequest {
  cwd: string;
  crId: string;
  strategy: 'merge' | 'pr';
}
export interface CRApproveResponse {
  cr: ChangeRequest;
  prNumber?: number;
  prUrl?: string;
}

export interface CRDiscardRequest { cwd: string; crId: string }
