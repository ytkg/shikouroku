import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 50,
        branches: 40
      }
    }
  }
});
