import { safeGetItem, safeSetItem } from "@clearcut/utils/safe-storage";

// The modal's "is this OTP a brand-new signup?" flag, written by the login screen after the OTP is sent and read by the
// OTP screen after a successful verify (it decides the Meta Lead hand-off, `meta_lead` in redirect.ts).
//
// localStorage stays the source (same key and values as before, so a reload between the two steps still works). Where
// storage is blocked (Facebook/Instagram in-app browsers, i.e. most ad traffic) the value is also kept in memory for this
// page, so a new signup there still gets its Lead instead of crashing the verify step as it did before.

const IS_NEW_USER_KEY = "is_new_user";
let inMemory: boolean | null = null;

export function rememberIsNewUser(isNewUser: boolean): void {
  inMemory = isNewUser;
  safeSetItem(IS_NEW_USER_KEY, isNewUser ? "true" : "false");
}

export function readIsNewUser(): boolean {
  const stored = safeGetItem(IS_NEW_USER_KEY);
  if (stored !== null) return stored === "true";
  return inMemory ?? false;
}
