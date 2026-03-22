import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: 'widget',
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 10_000,
  },
});
