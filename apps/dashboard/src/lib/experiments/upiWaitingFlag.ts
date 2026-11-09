// Amplitude flag `upi_waiting_watch` (CC-70, phase 88): poll the open payment
// attempt while the student approves it in the UPI app. ON only for variant
// `on`; anything else (no key, no user, error, timeout, flag off) = today's
// behaviour. Nothing here throws.

import { getFlagVariant, type FlagOptions } from "./experimentFlag";

export const UPI_WAITING_FLAG_KEY = "upi_waiting_watch";

export async function isUpiWaitingWatchEnabled(
  userId: string | null | undefined,
  options: FlagOptions = {},
): Promise<boolean> {
  const variant = await getFlagVariant(UPI_WAITING_FLAG_KEY, userId, { timeoutMs: 1500, ...options });
  return variant === "on";
}
