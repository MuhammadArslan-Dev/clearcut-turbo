import type { AuthApi } from "../api";
import type { UseAuthStore } from "../store/auth-store";
import type { UseAuthModalStore } from "../store/auth-modal-store";

export interface AuthSuccessResult {
  token: string;
  hasCourse: boolean;
  isNewUser: boolean;
  source: "otp" | "truecaller";
}

/**
 * Optional per-mount overrides for the login modal's marketing copy. Every
 * field is optional and the defaults are the original Dashboard/Landing/Blog
 * copy, so an app that passes nothing renders exactly what it always did.
 */
export interface LoginCopy {
  title?: string;
  /** Pass `null` to hide the subtitle line entirely. */
  subtitle?: string | null;
  submitLabel?: string;
  /** Defaults to true — the "3-day FREE Trial" box. */
  showTrialBanner?: boolean;
  /** Defaults to true — the "Trusted by 10,000+ students" line (mobile). */
  showTrustText?: boolean;
}

export interface AuthScreenDeps {
  authApi: AuthApi;
  useAuthStore: UseAuthStore;
  useAuthModal: UseAuthModalStore;
  /** Fires with the same event names/properties the original inline
   * `logAmplitudeEvent` calls used — pass your own analytics function to
   * preserve tracking, or omit for no tracking. */
  onEvent?: (name: string, properties?: Record<string, unknown>) => void;
  /** Associates this browser's Amplitude identity (and the first-touch UTM
   * properties it already carries) with the backend user uuid. Called only
   * for a brand-new signup at OTP-send time and, for everyone, after a
   * successful verify. Omit for no identification. */
  onIdentify?: (userId: string) => void;
  /**
   * When provided, a successful OTP/Truecaller login does NOT redirect to the
   * dashboard/onboarding app: the token is stored, the modal closes, and this
   * callback runs on the current page instead. Omit it (Landing/Blog/Dashboard
   * handoff) to keep the original `window.location.replace(...)` redirect.
   */
  onAuthenticated?: (result: AuthSuccessResult) => void;
}
