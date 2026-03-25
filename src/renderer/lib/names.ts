const TERMINAL_NAMES = [
  'Timber', 'Time', 'Tide', 'Trail', 'Torch',
  'Thorn', 'Trace', 'Talon', 'Terra', 'Topaz',
  'Tonic', 'Trend', 'Trust', 'Twist', 'Token',
  'Trove', 'Tuner', 'Turbo', 'Titan', 'Tango',
];

const CLAUDE_NAMES = [
  'Crest', 'Crisp', 'Cedar', 'Coral', 'Craft',
  'Crown', 'Cipher', 'Chrome', 'Cosmos', 'Cliff',
  'Cobalt', 'Crux', 'Calm', 'Core', 'Cove',
  'Crystal', 'Copper', 'Clever', 'Cross', 'Comet',
];

let terminalCounter = 0;
let claudeCounter = 0;

export const PRIMARY_CLAUDE_TITLE = 'Claude';

export function terminalName(): string {
  terminalCounter++;
  return TERMINAL_NAMES[(terminalCounter - 1) % TERMINAL_NAMES.length];
}

export function claudeName(): string {
  claudeCounter++;
  return CLAUDE_NAMES[(claudeCounter - 1) % CLAUDE_NAMES.length];
}

import { baseName } from './path';

export function diffName(file: string): string {
  return `D:${baseName(file)}`;
}

export function prName(number: number): string {
  return `PR:#${number}`;
}
