import { createPersistedStore } from "@clearcut/state/create-persisted-store";

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

export type AuthScreenType = "login" | "otp" | "register";

export interface AuthState {
  // UI State
  screen: AuthScreenType;
  loading: boolean;
  disabled: boolean;
  marketing: string;
  // Which exam/course the page that opened the login modal represents (e.g.
  // "htet") — set by that page before calling goToLogin(), read back out at
  // verify time to build the onboarding redirect's `course` param so a new
  // user's onboarding can preselect it. Empty when login was opened from a
  // page with no specific course context.
  course: string;

  // Auth Data
  userId: string;
  phone: string;
  otp: string;

  // Actions
  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  setUserId: (userId: string) => void;
  setDisabled: (disabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setScreen: (screen: AuthScreenType) => void;

  startLogin: () => void;
  loginSuccess: () => void;

  goToLogin: () => void;
  goToOtp: () => void;

  setMarketing: (marketing: string) => void;
  setCourse: (course: string) => void;

  verifyOtpStart: () => void;
  verifyOtpSuccess: () => void;

  reset: () => void;
}

/**
 * Factory (not a module-level singleton) so each app gets its own store
 * instance via `createAuthFeature`. 1:1 port of apps/landing's former
 * useAuthStore.ts, now built on the shared devtools-wrapped createStore.
 *
 * `userId` alone is persisted to localStorage (see `partialize` below) — the
 * backend's login endpoint accepts an optional `user_id` and, when it
 * matches an unverified/not-yet-tokened signup from the last 2 hours,
 * UPDATES that same row instead of creating a new one (see
 * AuthController::login). Without persisting it, a page refresh between
 * "phone submitted" and "OTP verified" loses this value from React/Zustand
 * state, so the next submit omits `user_id` and a duplicate pending user row
 * gets created. Everything else here (screen, loading, phone, otp) stays
 * ephemeral on purpose — reloading mid-flow should land back on a clean
 * login screen, not a stuck loading/otp state.
 */
export function createAuthStore() {
  return createPersistedStore<AuthState, { userId: string }>(
    "authStore",
    (set) => ({
    // =============================
    // Initial State
    // =============================
    screen: "register",
    loading: false,
    disabled: true,

    marketing: "",
    course: "",

    userId: "",
    phone: "",
    otp: "",

    // =============================
    // Setters
    // =============================
    setLoading: (loading) =>
      set(() => ({
        loading,
      })),

    setMarketing: (marketing) =>
      set(() => ({
        marketing,
      })),

    setCourse: (course) =>
      set(() => ({
        course,
      })),

    setScreen: (screen) =>
      set(() => ({
        screen,
      })),
    setPhone: (phone) =>
      set(() => ({
        phone,
      })),
    setUserId: (userId) =>
      set(() => ({
        userId,
      })),

    setOtp: (otp) =>
      set(() => ({
        otp,
      })),
    setDisabled: (disabled) =>
      set(() => ({
        disabled,
      })),

    // =============================
    // Login Flow
    // =============================
    startLogin: () =>
      set(() => ({
        loading: true,
        disabled: false,
      })),

    loginSuccess: () =>
      set(() => ({
        loading: false,
        disabled: true,
        screen: "otp",
      })),

    // =============================
    // Navigation
    // =============================
    goToLogin: () => {
      if (isMobile()) {
        window.history.pushState({ drawer: true }, "");
      }
      set({
        screen: "login",
        loading: false,
        disabled: true,
        otp: "",
      });
    },

    goToOtp: () => {
      if (isMobile()) {
        window.history.pushState({ drawer: true }, "");
      }
      set(() => ({
        screen: "otp",
        loading: false,
        disabled: true,
      }));
    },

    // =============================
    // OTP Verification
    // =============================
    verifyOtpStart: () =>
      set(() => ({
        loading: true,
        disabled: false,
      })),

    verifyOtpSuccess: () =>
      set(() => ({
        loading: false,
        disabled: true,
      })),

    // =============================
    // Reset Everything
    // =============================
    reset: () =>
      set(() => ({
        screen: "login",
        loading: false,
        disabled: true,
        phone: "",
        otp: "",
      })),
    }),
    {
      name: "clearcut-auth-pending-user",
      partialize: (s) => ({ userId: s.userId }),
    },
  );
}

export type UseAuthStore = ReturnType<typeof createAuthStore>;
