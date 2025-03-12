import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    include: ['**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/setupTests.ts']
    }
  }
});