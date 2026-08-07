import type { AuthApi } from "../api";
import type { UseAuthStore } from "../store/auth-store";
import type { UseAuthModalStore } from "../store/auth-modal-store";

export interface AuthScreenDeps {
  authApi: AuthApi;
  useAuthStore: UseAuthStore;
  useAuthModal: UseAuthModalStore;
  /** Fires with the same event names/properties the original inline
   * `logAmplitudeEvent` calls used — pass your own analytics function to
   * preserve tracking, or omit for no tracking. */
  onEvent?: (name: string, properties?: Record<string, unknown>) => void;
}
