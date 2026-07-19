import { useEffect, useRef } from "react";

interface OtpCredential {
  code?: string;
}

interface CredentialsContainerWithOtp {
  get(options: {
    otp: { transport: string[] };
    signal: AbortSignal;
  }): Promise<OtpCredential | null>;
}

/**
 * WebOTP API (https://developer.mozilla.org/en-US/docs/Web/API/WebOTP_API)
 * auto-read, ported verbatim from the identical effect that was duplicated
 * in otp-screen.tsx and result-step.tsx. No-ops on browsers without
 * `OTPCredential` support. `onCode` is called with the read code — callers
 * decide what to do with it (both existing call sites set local OTP state
 * AND immediately trigger verification with it).
 *
 * `onCode` is kept in a ref rather than the effect's dependency array on
 * purpose: in both original call sites the effect only ever ran once (their
 * dependency arrays only listed values that never changed in practice), so
 * the listener must not be torn down/recreated just because the caller
 * passes a new inline callback on every render — only `enabled` flipping
 * should restart it (which matters for otp-screen.tsx, where `enabled`
 * tracks a real screen transition).
 */
export function useWebOtpAutofill(onCode: (code: string) => void, enabled: boolean) {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;

    const controller = new AbortController();

    const readOtp = async () => {
      try {
        const credential = await (
          navigator.credentials as unknown as CredentialsContainerWithOtp
        ).get({
          otp: { transport: ["sms"] },
          signal: controller.signal,
        });

        if (credential?.code) {
          onCodeRef.current(credential.code);
        }
      } catch {
        // Silently ignore — matches existing behavior (AbortError on
        // unmount/cleanup is expected, other failures were already unlogged).
      }
    };

    readOtp();
    return () => controller.abort();
  }, [enabled]);
}
