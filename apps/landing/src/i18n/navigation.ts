import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link/useRouter/etc built from landing's own routing (not
// @clearcut/i18n/navigation, which is built from the shared en/hi-only
// config) — see routing.ts for why landing forks this instead of widening
// the shared package.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
