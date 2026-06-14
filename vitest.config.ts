import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'frontend/node_modules'],
    setupFiles: ['./frontend/src/__tests__/setup.ts'],
    environmentMatchGlobs: [
      ['frontend/**/*.test.tsx', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
