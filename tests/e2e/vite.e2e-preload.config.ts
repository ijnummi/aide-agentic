/**
 * Vite config for building preload script for e2e tests.
 */
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, '../../src/main/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    outDir: path.resolve(__dirname, '../../.vite/build-e2e'),
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron', /^node:/],
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../src/shared'),
    },
  },
});
