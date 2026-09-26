"use client";

import Text from "@clearcut/ui/text";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

/** Slim account strip above the tracker. Logged in: "you're logged in" +
 * Log out (drops the token only — every tracker on this browser stays put).
 * Logged out: a prompt to log in and load trackers saved earlier, shown only
 * on the screens where that list would appear (`showLoginPrompt`). */
export default function AccountBar({
  loggedIn,
  showLoginPrompt,
  onLogin,
  onLogout,
  locale = "en",
}: {
  loggedIn: boolean;
  showLoginPrompt: boolean;
  onLogin: () => void;
  onLogout: () => void;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);

  if (loggedIn) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--color-success-bg-soft)] px-4 py-2">
        <Text as="p" variant="body-small" color="gray-normal">
          {t.signedInNote}
        </Text>
        <button type="button" onClick={onLogout} className="text-sm font-medium text-brand hover:underline">
          {t.logoutLabel}
        </button>
      </div>
    );
  }

  if (!showLoginPrompt) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--color-primary-subtle)] px-4 py-2">
      <Text as="p" variant="body-small" color="gray-normal">
        {t.loginToLoadPrompt}
      </Text>
      <button type="button" onClick={onLogin} className="text-sm font-medium text-brand hover:underline">
        {t.loginLabel}
      </button>
    </div>
  );
}
