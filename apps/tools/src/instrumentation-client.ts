/**
 * Phase 17: tools' Sentry is fetched only after the page has loaded and the
 * browser is idle (lib/page-errors.ts owns the loader). With no DSN at build
 * time the branch is dead code and no Sentry bytes ship.
 */
import { installChunkErrorReload } from "@clearcut/error-reporting/chunk-reload";
import { applyLegacyPolyfills } from "@clearcut/error-reporting/legacy-polyfills";
import { whenIdleAfterLoad } from "@clearcut/error-reporting/when-idle";
import { loadSentry } from "@/lib/page-errors";

// CC-112, before anything else runs: `.at()` for old phones' browsers, and
// one reload when a chunk from a previous deploy can't be loaded. Both run
// with or without a Sentry DSN.
applyLegacyPolyfills();
installChunkErrorReload();

if (process.env.NEXT_PUBLIC_SENTRY_DSN) whenIdleAfterLoad(() => void loadSentry());
