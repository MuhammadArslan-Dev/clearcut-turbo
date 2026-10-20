import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  // Components under test may import CSS (e.g. KaTeX's stylesheet); tests
  // don't need styles, and the app's Tailwind PostCSS plugin doesn't load
  // under Vite, so give Vite an empty PostCSS config instead.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
