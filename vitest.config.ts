import { defineConfig, defineProject } from 'vitest/config';
import path from 'node:path';

const alias = {
  '@': path.resolve(__dirname, 'src/renderer'),
  '@shared': path.resolve(__dirname, 'src/shared'),
};

export default defineConfig({
  test: {
    projects: [
      defineProject({
        resolve: { alias },
        test: {
          name: 'main',
          include: ['tests/unit/main/**/*.test.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        resolve: { alias },
        test: {
          name: 'renderer',
          include: ['tests/unit/renderer/**/*.test.ts'],
          environment: 'jsdom',
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/shared/types/**',
        'src/**/*.d.ts',
        'src/main/main.ts',
        'src/main/preload.ts',
        'src/renderer/index.tsx',
      ],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
    reporters: ['default'],
  },
});
