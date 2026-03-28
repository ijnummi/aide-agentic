import { describe, it, expect } from 'vitest';
import { parseDiff } from '../../../../src/renderer/lib/diff-parser';

describe('parseDiff', () => {
  it('returns empty array for empty input', () => {
    expect(parseDiff('')).toEqual([]);
  });

  it('parses a modified file with one hunk', () => {
    const raw = `diff --git a/src/app.ts b/src/app.ts
index abc1234..def5678 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,3 +10,4 @@ function init() {
   const a = 1;
-  const b = 2;
+  const b = 3;
+  const c = 4;
`;

    const files = parseDiff(raw);
    expect(files).toHaveLength(1);
    expect(files[0].oldPath).toBe('src/app.ts');
    expect(files[0].newPath).toBe('src/app.ts');
    expect(files[0].status).toBe('modified');
    expect(files[0].hunks).toHaveLength(1);

    const hunk = files[0].hunks[0];
    expect(hunk.oldStart).toBe(10);
    expect(hunk.oldCount).toBe(3);
    expect(hunk.newStart).toBe(10);
    expect(hunk.newCount).toBe(4);
    expect(hunk.header).toBe('function init() {');

    expect(hunk.lines).toEqual([
      { type: 'context', oldLineNumber: 10, newLineNumber: 10, content: '  const a = 1;' },
      { type: 'delete', oldLineNumber: 11, content: '  const b = 2;' },
      { type: 'add', newLineNumber: 11, content: '  const b = 3;' },
      { type: 'add', newLineNumber: 12, content: '  const c = 4;' },
    ]);
  });

  it('detects added files', () => {
    const raw = `diff --git a/new.ts b/new.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,2 @@
+line 1
+line 2
`;
    const files = parseDiff(raw);
    expect(files[0].status).toBe('added');
  });

  it('detects deleted files', () => {
    const raw = `diff --git a/old.ts b/old.ts
deleted file mode 100644
index abc1234..0000000
--- a/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-line 1
-line 2
`;
    const files = parseDiff(raw);
    expect(files[0].status).toBe('deleted');
  });

  it('detects renamed files', () => {
    const raw = `diff --git a/old.ts b/new.ts
similarity index 90%
rename from old.ts
rename to new.ts
index abc1234..def5678 100644
`;
    const files = parseDiff(raw);
    expect(files[0].oldPath).toBe('old.ts');
    expect(files[0].newPath).toBe('new.ts');
    expect(files[0].status).toBe('renamed');
  });

  it('parses multiple files', () => {
    const raw = `diff --git a/a.ts b/a.ts
index 111..222 100644
--- a/a.ts
+++ b/a.ts
@@ -1,1 +1,1 @@
-old
+new
diff --git a/b.ts b/b.ts
index 333..444 100644
--- a/b.ts
+++ b/b.ts
@@ -1,1 +1,1 @@
-foo
+bar
`;
    const files = parseDiff(raw);
    expect(files).toHaveLength(2);
    expect(files[0].oldPath).toBe('a.ts');
    expect(files[1].oldPath).toBe('b.ts');
  });

  it('parses multiple hunks in one file', () => {
    const raw = `diff --git a/f.ts b/f.ts
index 111..222 100644
--- a/f.ts
+++ b/f.ts
@@ -1,2 +1,2 @@
-a
+b
 c
@@ -20,2 +20,2 @@
-x
+y
 z
`;
    const files = parseDiff(raw);
    expect(files[0].hunks).toHaveLength(2);
    expect(files[0].hunks[0].oldStart).toBe(1);
    expect(files[0].hunks[1].oldStart).toBe(20);
  });
});
