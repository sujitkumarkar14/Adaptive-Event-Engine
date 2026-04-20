import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary"],
            include: ["src/**/*.ts"],
            // `index.ts` is the Functions HTTP/callable entrypoint; behavior is covered by integration/emulator suites.
            exclude: ["src/**/*.test.ts", "src/**/__tests__/**", "src/index.ts"],
        },
    },
});
