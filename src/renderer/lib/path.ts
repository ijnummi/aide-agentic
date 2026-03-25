/** Extract the last segment of a path (like `path.basename` without Node.js) */
export function baseName(path: string): string {
  return path.split('/').pop() || path;
}
