export interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  bare?: boolean;
}

export interface WorktreeAddRequest {
  cwd: string;
  path: string;
  branch: string;
  createBranch?: boolean;
}

export interface WorktreeRemoveRequest {
  cwd: string;
  path: string;
  force?: boolean;
}
