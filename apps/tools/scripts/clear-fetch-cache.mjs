// Static export: every page is built from the tools API at build time, and
// Next keeps those fetch() responses in .next/cache/fetch-cache across builds.
// A later build then reused weeks-old API data (2026-10-22: production was
// built from a 2026-10-05 cache, so exam logos/specs added since never
// shipped — CC-25). Clearing it makes every build read the live API.
import { rmSync } from "node:fs";

rmSync(new URL("../.next/cache/fetch-cache", import.meta.url), { recursive: true, force: true });
