import type { DiffFile, DiffHunk, DiffLine } from '../../shared/types/git';

export function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileChunks = raw.split(/^diff --git /m).filter(Boolean);

  for (const chunk of fileChunks) {
    const lines = chunk.split('\n');
    const headerLine = lines[0];

    // Parse "a/path b/path"
    const pathMatch = headerLine.match(/a\/(.+?) b\/(.+)/);
    if (!pathMatch) continue;

    const oldPath = pathMatch[1];
    const newPath = pathMatch[2];

    let status: DiffFile['status'] = 'modified';
    for (const line of lines.slice(1, 5)) {
      if (line.startsWith('new file')) status = 'added';
      else if (line.startsWith('deleted file')) status = 'deleted';
      else if (line.startsWith('rename from')) status = 'renamed';
    }

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
      if (hunkMatch) {
        currentHunk = {
          oldStart: parseInt(hunkMatch[1], 10),
          oldCount: parseInt(hunkMatch[2] || '1', 10),
          newStart: parseInt(hunkMatch[3], 10),
          newCount: parseInt(hunkMatch[4] || '1', 10),
          header: hunkMatch[5].trim(),
          lines: [],
        };
        hunks.push(currentHunk);
        oldLine = currentHunk.oldStart;
        newLine = currentHunk.newStart;
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          newLineNumber: newLine++,
          content: line.slice(1),
        });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'delete',
          oldLineNumber: oldLine++,
          content: line.slice(1),
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
          content: line.slice(1),
        });
      }
    }

    files.push({ oldPath, newPath, status, hunks });
  }

  return files;
}
