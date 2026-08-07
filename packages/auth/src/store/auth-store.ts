import { createStore } from "@clearcut/state/create-store";

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

  verifyOtpStart: () => void;
  verifyOtpSuccess: () => void;

  reset: () => void;
}

/**
 * Factory (not a module-level singleton) so each app gets its own store
 * instance via `createAuthFeature`. 1:1 port of apps/landing's former
 * useAuthStore.ts, now built on the shared devtools-wrapped createStore.
 */
export function createAuthStore() {
  return createStore<AuthState>("authStore", (set) => ({
    // =============================
    // Initial State
    // =============================
    screen: "register",
    loading: false,
    disabled: true,

    marketing: "",

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
  }));
}

export type UseAuthStore = ReturnType<typeof createAuthStore>;
