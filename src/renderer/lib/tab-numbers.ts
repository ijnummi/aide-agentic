import type { TabItem } from '../../shared/types/layout';

const ALL_CHANGES_TAB_ID = 'diff-all-changes';
const RESERVED_NUMBER = 4;

/**
 * Compute display numbers for tabs.
 * "All Changes" always gets number 4. Other tabs get sequential numbers skipping 4.
 */
export function getTabNumbers(tabs: TabItem[]): Map<string, number> {
  const result = new Map<string, number>();
  let num = 0;
  for (const tab of tabs) {
    if (tab.id === ALL_CHANGES_TAB_ID) {
      result.set(tab.id, RESERVED_NUMBER);
    } else {
      num++;
      if (num === RESERVED_NUMBER) num++;
      result.set(tab.id, num);
    }
  }
  return result;
}

/** Find tab ID by its display number */
export function findTabByNumber(tabs: TabItem[], displayNumber: number): string | null {
  const numbers = getTabNumbers(tabs);
  for (const [tabId, num] of numbers) {
    if (num === displayNumber) return tabId;
  }
  return null;
}

export { ALL_CHANGES_TAB_ID, RESERVED_NUMBER };
