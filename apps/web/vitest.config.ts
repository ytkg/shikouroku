import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: "v8",
        thresholds: {
          lines: 70,
          statements: 70,
          functions: 65,
          branches: 60
        }
      }
    }
  })
);
