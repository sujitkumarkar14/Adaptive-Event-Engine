import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__tests__/fixtures/**',
      ],
      // Raised toward current measured coverage (~63% lines / ~56% branches); relax if adding large untested surfaces.
      thresholds: {
        lines: 55,
        branches: 48,
        functions: 48,
        statements: 55,
      },
    },
  },
});
