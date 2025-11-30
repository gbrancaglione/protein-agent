import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'spec/',
        '**/*.config.*',
        '**/generated/**',
        '**/scripts/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/home/gbran/protein-agent/src',
    },
  },
});

