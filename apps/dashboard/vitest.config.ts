import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests of pure logic (phase 72). Same shape as apps/blog/vitest.config.ts:
// Vite doesn't read tsconfig `paths`, so the "@" alias is repeated here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
