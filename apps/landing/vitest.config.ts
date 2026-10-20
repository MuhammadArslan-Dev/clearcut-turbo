import path from "node:path";
import { defineConfig } from "vitest/config";

// Same minimal setup as apps/blog: Vite doesn't read tsconfig `paths`, so the
// "@" alias is repeated here.
export default defineConfig({
  test: {
    environment: "node",
    // next-intl imports "next/navigation" without an extension, which Node's
    // ESM loader rejects; inlining lets Vite resolve it (needed by tests that
    // import a route module, e.g. the compare page's generateMetadata).
    server: { deps: { inline: ["next-intl"] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
