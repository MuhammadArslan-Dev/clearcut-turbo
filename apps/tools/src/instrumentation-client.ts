/**
 * Phase 17: tools' Sentry is fetched only after the page has loaded and the
 * browser is idle (lib/page-errors.ts owns the loader). With no DSN at build
 * time the branch is dead code and no Sentry bytes ship.
 */
import { whenIdleAfterLoad } from "@clearcut/error-reporting/when-idle";
import { loadSentry } from "@/lib/page-errors";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) whenIdleAfterLoad(() => void loadSentry());
