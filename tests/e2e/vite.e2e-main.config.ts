/**
 * Vite config for building main process for e2e tests.
 * Mirrors the forge Vite plugin's main config with e2e-specific defines.
 */
import { defineConfig } from 'vite';
import path from 'node:path';
import { builtinModules } from 'node:module';

const E2E_RENDERER_PORT = 5199;

// Match forge plugin: externalize Node.js builtins (both bare and node: prefixed) + electron
const externals = [
  'electron',
  'electron/main',
  'electron-squirrel-startup',
  'node-pty',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, '../../src/main/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    outDir: path.resolve(__dirname, '../../.vite/build-e2e'),
    emptyOutDir: false,
    rollupOptions: {
      external: externals,
    },
    minify: false,
    sourcemap: false,
  },
  define: {
    MAIN_WINDOW_VITE_DEV_SERVER_URL: JSON.stringify(`http://localhost:${E2E_RENDERER_PORT}`),
    MAIN_WINDOW_VITE_NAME: JSON.stringify('main_window'),
  },
  resolve: {
    // Match forge plugin: resolve Node.js conditions for packages like electron-store
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    alias: {
      '@shared': path.resolve(__dirname, '../../src/shared'),
    },
  },
});
