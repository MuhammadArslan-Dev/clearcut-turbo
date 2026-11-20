"use client";

import { useSyncExternalStore } from "react";
import { getSaveConsent, setSaveConsent, subscribeSaveConsent } from "@/lib/savedImages/logic";

/**
 * CC-174: the opt-in "Save my photo & signature to my account" checkbox, shown inside the
 * shared login sheet (LoginCopy.extraContent). Unticked by default; the download code reads the
 * value after verification and stores the original only when it is ticked.
 */
export default function SaveConsentCheckbox({ label }: { label: string }) {
  const checked = useSyncExternalStore(subscribeSaveConsent, getSaveConsent, () => false);
  return (
    <label className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border-gray-subtle)] p-3 text-left body-small text-text-gray-normal">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setSaveConsent(e.target.checked)}
        className="accent-brand mt-0.5 h-5 w-5 shrink-0"
        data-testid="save-consent"
      />
      <span>{label}</span>
    </label>
  );
}
