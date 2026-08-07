"use client";

import * as React from "react";

/**
 * Passthrough — MUI Joy removed.
 *
 * This used to mount Joy's `CssVarsProvider` with `@/themes/theme`. Both are gone:
 * no Joy component renders anywhere in the repository, so the provider had no
 * consumers and was only emitting ~892 unused `--joy-*` custom properties onto
 * :root. Every one of the deleted theme's 46 `--joy-palette-*` references pointed
 * at Joy's own variables and was consumed only by the theme file itself — verified
 * by a repo-wide scan of .ts/.tsx/.css before deletion.
 *
 * The component is kept rather than unwired from the layout so the provider
 * nesting in `app/[locale]/layout.tsx` is untouched, matching the same
 * passthrough that apps/landing already uses. It is also the natural place for a
 * real theme provider (e.g. colour-scheme switching) if one is needed later.
 * Deleting it is optional cleanup, not part of this milestone.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
