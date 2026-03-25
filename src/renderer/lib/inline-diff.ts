export interface DiffSegment {
  text: string;
  changed: boolean;
}

/**
 * Compute inline diff segments between two strings.
 * Finds common prefix and suffix, marks the middle as changed.
 */
export function computeInlineDiff(oldStr: string, newStr: string): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  // Find common prefix length
  let prefix = 0;
  const minLen = Math.min(oldStr.length, newStr.length);
  while (prefix < minLen && oldStr[prefix] === newStr[prefix]) prefix++;

  // Find common suffix length (not overlapping with prefix)
  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    oldStr[oldStr.length - 1 - suffix] === newStr[newStr.length - 1 - suffix]
  ) suffix++;

  const commonPrefix = oldStr.slice(0, prefix);
  const commonSuffix = suffix > 0 ? oldStr.slice(oldStr.length - suffix) : '';
  const oldChanged = oldStr.slice(prefix, oldStr.length - suffix);
  const newChanged = newStr.slice(prefix, newStr.length - suffix);

  const oldSegments: DiffSegment[] = [];
  const newSegments: DiffSegment[] = [];

  if (commonPrefix) {
    oldSegments.push({ text: commonPrefix, changed: false });
    newSegments.push({ text: commonPrefix, changed: false });
  }
  if (oldChanged) oldSegments.push({ text: oldChanged, changed: true });
  if (newChanged) newSegments.push({ text: newChanged, changed: true });
  if (commonSuffix) {
    oldSegments.push({ text: commonSuffix, changed: false });
    newSegments.push({ text: commonSuffix, changed: false });
  }

  // If nothing is marked changed (identical lines), return as unchanged
  if (!oldChanged && !newChanged) {
    return {
      oldSegments: [{ text: oldStr, changed: false }],
      newSegments: [{ text: newStr, changed: false }],
    };
  }

  return { oldSegments, newSegments };
}
