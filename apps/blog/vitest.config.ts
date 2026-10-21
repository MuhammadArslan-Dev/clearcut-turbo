import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

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
      // Next resolves "server-only" itself (a build error if a client
      // component imports a server module); tests run as server code.
      "server-only": require.resolve("next/dist/compiled/server-only/empty.js"),
    },
  },
});
