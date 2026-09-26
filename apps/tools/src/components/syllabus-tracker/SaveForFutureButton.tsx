"use client";

import { Button } from "@clearcut/ui/button";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Explicit "Save for Future" action for one tracker. Deliberately dumb: the
 * parent decides whether a click needs a login first — this only reflects
 * the status it's told about ("saved" means the account copy matches what's
 * on screen right now, and reverts to idle the moment a chapter changes). */
export default function SaveForFutureButton({
  status,
  onSave,
  locale = "en",
}: {
  status: SaveStatus;
  onSave: () => void;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);

  if (status === "saved") {
    return (
      <Button variant="soft" color="success" size="sm" disabled>
        ✓ {t.savedToAccount}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === "error" && (
        <span role="alert" className="text-xs text-[var(--color-danger)]">
          {t.saveFailed}
        </span>
      )}
      <Button variant="solid" color="primary" size="sm" loading={status === "saving"} disabled={status === "saving"} onClick={onSave}>
        {status === "saving" ? t.saving : t.saveForFuture}
      </Button>
    </div>
  );
}
