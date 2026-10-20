import path from "node:path";
import { defineConfig } from "vitest/config";

// Same minimal setup as apps/blog and apps/landing: Vite doesn't read
// tsconfig `paths`, so the "@" alias is repeated here.
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
