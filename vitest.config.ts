import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    /** Stable unit tests: routing tests expect local mock geometry; local `.env` may set `VITE_USE_ROUTING_MOCK=false` for prod builds. */
    env: {
      VITE_USE_ROUTING_MOCK: 'true',
    },
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/lib/firebase.ts',
        'src/contexts/AuthContext.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__tests__/fixtures/**',
      ],
      // Targets on measured code (Firebase bootstrap + AuthProvider excluded — see TESTING.md).
      thresholds: {
        lines: 77,
        branches: 65,
        functions: 70,
        statements: 75,
      },
    },
  },
});
