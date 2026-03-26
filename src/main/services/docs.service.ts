import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DEFAULT_SETTINGS } from '../../shared/settings';
import type {
  DocFileEntry,
  DocCategory,
  DocsDiscoverResponse,
  DocsReadResponse,
} from '../../shared/types/docs';

const settings = DEFAULT_SETTINGS.docs;

export class DocsService {
  async discover(cwd: string): Promise<DocsDiscoverResponse> {
    const files: DocFileEntry[] = [];

    // Skills: .md files in .claude/commands/
    await this.scanDir(cwd, settings.skillsDir, 'skills', files);

    // Instructions: CLAUDE.md files
    await this.checkFiles(cwd, settings.instructionFiles, 'instructions', files);

    // Documentation: README, CONTRIBUTING, etc.
    await this.checkFiles(cwd, settings.documentationFiles, 'documentation', files);

    // Tasks: TODO, ROADMAP, etc.
    await this.checkFiles(cwd, settings.taskFiles, 'tasks', files);

    return { files };
  }

  async readFile(filePath: string): Promise<DocsReadResponse> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const format = ext === '.md' ? 'markdown' : 'text';
    return { content, format };
  }

  private async scanDir(
    cwd: string,
    relDir: string,
    category: DocCategory,
    out: DocFileEntry[],
  ): Promise<void> {
    const dir = path.join(cwd, relDir);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return; // directory doesn't exist
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      try {
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }
      const relativePath = path.join(relDir, entry);
      out.push({ path: fullPath, name: entry, category, relativePath });
    }
  }

  private async checkFiles(
    cwd: string,
    relPaths: string[],
    category: DocCategory,
    out: DocFileEntry[],
  ): Promise<void> {
    for (const rel of relPaths) {
      const fullPath = path.join(cwd, rel);
      try {
        await fs.access(fullPath);
      } catch {
        continue; // file doesn't exist
      }
      out.push({
        path: fullPath,
        name: path.basename(rel),
        category,
        relativePath: rel,
      });
    }
  }
}
