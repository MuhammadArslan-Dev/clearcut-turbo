// Amplitude flag `onboarding_level_step` (CC-81, phase 86): ask paper + combination/subject inside onboarding.
// ON only for variant `on`; anything else (no key, no user, error, timeout, flag off) = today's flow
// (enrol, then "विषय जोड़ें" on the dashboard). Nothing here throws.

import { getFlagVariant, type FlagOptions } from "./experimentFlag";

export const ONBOARDING_LEVEL_FLAG_KEY = "onboarding_level_step";

export async function isOnboardingLevelStepEnabled(
  userId: string | null | undefined,
  options: FlagOptions = {},
): Promise<boolean> {
  const variant = await getFlagVariant(ONBOARDING_LEVEL_FLAG_KEY, userId, { timeoutMs: 1500, ...options });
  return variant === "on";
}
