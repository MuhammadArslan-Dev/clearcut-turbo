"use client";

import Button from "@clearcut/ui/button";
import type { TruecallerLoginState } from "../truecaller";

export interface TruecallerButtonProps {
  state: TruecallerLoginState;
  error: string | null;
  onClick: () => void;
  /** Overridable for i18n callers (e.g. StartAuthForm's Hindi copy) — the
   * English defaults match the design built on /start, which is the single
   * source of truth for this button's text and look. Change the defaults
   * here to change it everywhere this component is used. */
  label?: string;
  waitingLabel?: string;
  unavailableMessage?: string;
}

/**
 * The one Truecaller login button, shared by every surface that renders it
 * (the shared login modal via login-screen.tsx, and /start's
 * StartAuthForm.tsx) — a single place to change its design/text so an edit
 * here applies everywhere instead of needing to be repeated per consumer.
 * Design matches what was built directly on /start — solid button, no icon.
 * WhatsApp login (a separate, unrelated button) is intentionally not part of
 * this component — only Truecaller is shown today.
 */
export function TruecallerButton({
  state,
  error,
  onClick,
  label = "Start with Truecaller",
  waitingLabel = "Waiting…",
  unavailableMessage = "Truecaller app not found — continue below",
}: TruecallerButtonProps) {
  const busy = state === "opening" || state === "waiting";

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        size="lg"
        sx={{ borderRadius: "50px" }}
        className="shadow-sm"
        fullWidth
        onClick={onClick}
        disabled={busy}
        loading={busy}
      >
        {state === "waiting" ? waitingLabel : label}
      </Button>

      {state === "unavailable" && (
        <p className="text-sm text-center text-[var(--color-text-gray-muted)]">
          {unavailableMessage}
        </p>
      )}
      {state === "error" && error && (
        <p className="text-sm text-center text-red-600">{error}</p>
      )}
    </div>
  );
}
