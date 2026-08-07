import { createStore } from "@clearcut/state/create-store";

export type OtpOrigin = "login" | "register";
export type AuthModalType = "login" | "register" | "otp";

export interface AuthModalPayload {
  mobileNumber?: string;
  from?: OtpOrigin;
}

export interface AuthModalState {
  isOpen: boolean;
  type: AuthModalType | null;
  payload: AuthModalPayload;

  openModal: (args: { type: AuthModalType; payload?: AuthModalPayload }) => void;
  closeModal: () => void;
}

const initialState = {
  isOpen: false,
  type: null,
  payload: {
    mobileNumber: "",
    from: "login" as OtpOrigin,
  },
};

/**
 * Factory (not a module-level singleton), matching `createAuthStore`. 1:1
 * port of apps/landing's former authModalStore.ts.
 */
export function createAuthModalStore() {
  return createStore<AuthModalState>("authModalStore", (set) => ({
    ...initialState,

    openModal: ({ type, payload = {} }) =>
      set((state) => ({
        isOpen: true,
        type,
        payload: { ...state.payload, ...payload },
      })),

    closeModal: () => set(initialState),
  }));
}

export type UseAuthModalStore = ReturnType<typeof createAuthModalStore>;
