declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export interface IdentifyClarityUserInput {
  /**
   * A stable, non-PII identifier — `uuid` or `user_id`, never the raw phone
   * number. Passed to Clarity's `identify` call, which Microsoft's own docs
   * ask you to keep free of personal data (it's echoed back into Clarity's
   * dashboard/exports, which more people can see than should see a raw
   * phone number).
   */
  userId?: string | number | null;
  /**
   * Optional, and NOT sent via `identify` — set as a separate custom tag
   * instead (`clarity('set', 'phone', ...)`), which is filterable in
   * Clarity's dashboard without being the primary session identifier.
   * Confirm this is acceptable for your privacy/compliance posture before
   * relying on it — Clarity stores whatever you pass here as-is.
   */
  phone?: string | null;
}

/**
 * Associates the current Clarity session with a real user, once the app
 * knows who that is (after login, or once a cached session resolves). Safe
 * to call before Clarity has loaded — `window.clarity` is undefined until
 * LazyClarity's script runs, so this just no-ops until then; call sites
 * don't need to coordinate load order themselves.
 *
 * Not called automatically by LazyClarity — each app calls this from
 * wherever it already knows the user (dashboard: AuthProvider once `user`
 * resolves; blog/landing: the OTP/Truecaller verify success paths).
 */
export function identifyClarityUser({ userId, phone }: IdentifyClarityUserInput) {
  if (typeof window === "undefined" || !window.clarity) return;

  if (userId) {
    window.clarity("identify", String(userId));
  }

  if (phone) {
    window.clarity("set", "phone", phone);
  }
}
