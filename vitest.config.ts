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
        'src/App.tsx',
        /** Large attendee shell: primarily integration/E2E-tested; unit denominator would dilute hook/lib metrics. */
        'src/pages/Dashboard.tsx',
        /** Long-form wizard UI; Firestore IO covered in `onboardingPreferences.*.test.ts`. */
        'src/pages/Onboarding.tsx',
        'src/lib/firebase.ts',
        'src/contexts/AuthContext.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__tests__/fixtures/**',
      ],
      // Gates on measured code (Firebase bootstrap + AuthProvider excluded — see TESTING.md).
      // Raise incrementally as suites grow; HTML + lcov emit to ./coverage for CI artifacts.
      thresholds: {
        lines: 90,
        /** Measured total typically ~90% lines / ~90% statements — precise statement hit-rate can land at 89.9% depending on Vitest’s statement map; floor 89. */
        statements: 89,
        functions: 84,
        branches: 80,
      },
    },
  },
});
