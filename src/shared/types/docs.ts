export type DocCategory = 'skills' | 'instructions' | 'documentation' | 'tasks';

export interface DocFileEntry {
  /** Absolute path to the file */
  path: string;
  /** Display name (e.g., "CLAUDE.md", "commit.md") */
  name: string;
  /** Which category this file belongs to */
  category: DocCategory;
  /** Relative path from project root for display */
  relativePath: string;
}

export interface DocsDiscoverRequest {
  cwd: string;
}

export interface DocsDiscoverResponse {
  files: DocFileEntry[];
}

export interface DocsReadRequest {
  filePath: string;
}

export interface DocsReadResponse {
  content: string;
  format: 'markdown' | 'text';
}

export interface DocsWriteRequest {
  filePath: string;
  content: string;
}
