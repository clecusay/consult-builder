import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: __dirname })],
  test: {
    name: 'web',
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['__tests__/setup.ts'],
    testTimeout: 15_000,
    fileParallelism: false,
  },
});
