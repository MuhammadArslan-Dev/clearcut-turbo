"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Button from "@clearcut/ui/button";
import MainInput from "@clearcut/ui/main-input";
import { AnimatePresence } from "framer-motion";

import { DrawerSheet } from "../ui/drawer-sheet";
import { Modal } from "../ui/modal";
import { useBackHandler } from "@clearcut/hooks/use-back-handler";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { setToken } from "../token";
import { buildPostVerifyRedirectUrl, createLeadId, getCurrentLocale } from "../redirect";
import { identifyClarityUser } from "@clearcut/analytics/clarity";
import MainAppLogo from "../icons/main-app-logo";
import {
  AuthCloseButton,
  AuthIllustration,
  ArrowLeftIcon,
  KeyIcon,
  PencilIcon,
} from "../ui/auth-sheet-parts";
import {
  getAuthFailureReason,
  trackAuthFailure,
  trackAuthSuccess,
  trackVerificationFailed,
  trackVerificationResent,
} from "../verification-events";
import type { AuthScreenDeps, LoginCopy } from "./types";

const OTP_LENGTH = 4;
const RESEND_INTERVAL = 30;

export interface CreateOtpScreenOptions extends AuthScreenDeps {
  redirectBaseUrl: string;
}

/**
 * 1:1 port of apps/landing's former otp-screen.tsx, parameterized by the
 * app's authApi/stores/analytics/redirect base URL. The modal flow always
 * passes `userType: "old"` to the redirect builder — matching the original
 * file's hardcoded behavior (see redirect.ts for why this isn't unified
 * with the onboarding flow's `new`/`old` computation).
 */
export function createOtpScreen({
  authApi,
  useAuthStore,
  useAuthModal,
  onEvent,
  onIdentify,
  redirectBaseUrl,
  onAuthenticated,
  assetBase,
}: CreateOtpScreenOptions) {
  function OTPScreen({ loginCopy }: { loginCopy?: LoginCopy } = {}) {
    const otpSubmitLabel = loginCopy?.otpSubmitLabel ?? "Verify OTP";
    const isMobile = useIsMobile();
    const { closeModal } = useAuthModal();

    const {
      phone,
      userId,
      setUserId,
      otp,
      setOtp,
      goToLogin,
      verifyOtpStart,
      screen,
      loading,
      setScreen,
      setLoading,
      course,
    } = useAuthStore();

    const [error, setError] = useState("");
    const [resendingOtp, setResendingOtp] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_INTERVAL);
    // Successful resends for THIS login flow (resets if the number changes);
    // sent as `resend_count` on the Verification Resent event.
    const resendCountRef = useRef(0);
    useEffect(() => {
      resendCountRef.current = 0;
    }, [phone]);

    const isVerifyingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Bumped after a wrong/expired OTP: the OTP input remounts as a new
    // element, so Chrome builds a fresh keyboard OTP chip for it instead of
    // re-offering the code it already filled into the old element. No
    // blur(): on Android that closes the keyboard and a scripted focus()
    // can't reopen it.
    const [otpFieldKey, setOtpFieldKey] = useState(0);
    useEffect(() => {
      if (otpFieldKey) inputRef.current?.focus();
    }, [otpFieldKey]);

    /* ---------------- TIMER ---------------- */

    useEffect(() => {
      if (screen !== "otp") return;

      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      setResendTimer(RESEND_INTERVAL);

      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(focusTimeout);
        clearInterval(interval);
      };
    }, [screen]);

    /* ---------------- DUMMY NUMBER AUTO-FILL ---------------- */

    useEffect(() => {
      if (screen === "otp" && phone === "9988776655") {
        setOtp("4321");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen, phone]);

    /* ---------------- AUTO READ OTP ---------------- */
    // No WebOTP call (use-web-otp-autofill.ts): our SMS has no
    // "@<host> #<code>" last line, so Chrome's "Allow" sheet never filled the
    // code — and while that request is pending Chrome shows the sheet instead
    // of the keyboard's OTP chip. The input's autoComplete="one-time-code"
    // gives the chip; tapping it fills the input and onChange verifies.

    /* ---------------- VERIFY ---------------- */

    const handleVerify = async (autoOtp?: string) => {
      if (isVerifyingRef.current) return;

      const finalOtp = autoOtp || otp;

      if (!finalOtp || finalOtp.length !== OTP_LENGTH) {
        setError("Enter valid OTP");
        return;
      }

      isVerifyingRef.current = true;
      setError("");
      verifyOtpStart();

      // One Authentication Outcome per attempt: set once the success event is
      // out so a later throw (analytics/redirect code) can't add a `failed`.
      let outcomeTracked = false;

      try {
        const lang = getCurrentLocale();

        const res = await authApi.verifyOtp({ phone, otp: finalOtp });
        const { data, status } = res.data;

        if (status !== "success") throw new Error("Verification failed");

        setToken(data.token);
        if (userId) onIdentify?.(userId);
        trackAuthSuccess(onEvent);
        outcomeTracked = true;
        // Verified now — no longer a "pending" row a future refresh should
        // try to reuse/update (also clears the persisted localStorage copy).
        setUserId("");
        const isNewUser = localStorage.getItem("is_new_user") === "true";
        identifyClarityUser({ userId, phone });

        // Stay-on-page mode (apps/tools): token is already stored above; just
        // close the modal and hand control back to the app — no redirect, no
        // reload, so the page/state the user was on is untouched.
        if (onAuthenticated) {
          setLoading(false);
          setOtp("");
          setScreen("register");
          onAuthenticated({
            token: data.token,
            hasCourse: Boolean(data.has_course),
            isNewUser,
            source: "otp",
          });
          return;
        }

        // Meta "Lead" can only ever pick up phone/external_id on
        // app.clearcutoff.in's FIRST real Pixel init() call (see that app's
        // FacebookPixel.tsx) — this landing/blog pixel already called init()
        // without user data when this page loaded, so firing Lead here would
        // permanently lock phone/external_id out of it. `leadId` is a
        // one-time registration-occurrence token (never the permanent user
        // id — a refresh/replay of this same registration must not mint a
        // new Lead), threaded through the redirect so the app side fires
        // Lead exactly once, with a real event_id.
        const leadId = isNewUser ? createLeadId() : undefined;

        const redirectUrl = buildPostVerifyRedirectUrl({
          baseUrl: redirectBaseUrl,
          token: data.token,
          hasCourse: data.has_course,
          userType: "old",
          lang,
          course,
          leadId,
        });

        // No verifyOtpSuccess() here on purpose: it flips `loading` back to
        // false, and window.location.replace() doesn't unload the page
        // synchronously — React re-renders with the button back in its
        // normal state for the moment before navigation actually happens,
        // which reads as the "Verify OTP" button flickering right before
        // the redirect. Leaving `loading` true keeps the spinner up
        // continuously until the browser actually navigates away.
        window.location.replace(redirectUrl);
      } catch (err: unknown) {
        // One classifier for the event and the message (CC-87) — it reads
        // the ApiError's `.status`; the old `err.response.status` check
        // never matched, so every failure was "Something went wrong".
        const reason = getAuthFailureReason(err);
        if (!outcomeTracked) trackAuthFailure(onEvent, reason);
        setLoading(false);
        if (reason === "incorrect_otp" || reason === "otp_expired") {
          setError(
            reason === "otp_expired"
              ? "This OTP has expired. Tap Resend OTP to get a new one."
              : "Invalid or expired OTP. Please try again.",
          );
          if (reason === "otp_expired") setResendTimer(0);
          // Most often the keyboard chip's code from a previous login —
          // clear it and remount the input (see otpFieldKey).
          setOtp("");
          setOtpFieldKey((k) => k + 1);
        } else if (reason === "too_many_attempts") {
          setError("Too many attempts. Please wait a minute and try again.");
        } else if (reason === "server_error") {
          setError("Server error. Please try again.");
        } else if (reason === "network_error" || reason === "timeout") {
          setError("No internet connection.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        isVerifyingRef.current = false;
      }
    };

    /* ---------------- RESEND OTP ---------------- */

    const handleResendOtp = async () => {
      if (resendTimer > 0) return;

      setResendingOtp(true);

      try {
        await authApi.loginUser({ phone });
        setResendTimer(RESEND_INTERVAL);
        // CC-54: a new OTP is on its way, so the old code must not stay in
        // the field, and the input is remounted (+ refocused) so the
        // keyboard's one-time-code chip offers the NEW SMS, not the old one.
        setOtp("");
        setError("");
        setOtpFieldKey((k) => k + 1);

        resendCountRef.current += 1;
        trackVerificationResent(onEvent, phone, resendCountRef.current);
      } catch (err) {
        // Used to fail silently (console only).
        const reason = getAuthFailureReason(err);
        trackVerificationFailed(onEvent, phone, reason, true);
        setError(
          reason === "too_many_attempts"
            ? "Too many attempts. Please wait a minute and try again."
            : reason === "network_error" || reason === "timeout"
              ? "No internet connection."
              : "Couldn't resend the OTP. Please try again.",
        );
      } finally {
        setResendingOtp(false);
      }
    };

    /* ---------------- CONTAINER ---------------- */

    const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

    const handleClose = () => {
      closeModal();
      setScreen("register");
    };

    useBackHandler({
      isOpen: screen === "otp",
      onClose: handleClose,
    });

    /* ---------------- UI ---------------- */

    return (
      <AnimatePresence>
        {screen === "otp" && (
          <Container isOpen={true} onClose={handleClose}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-otp-title"
              className="relative h-full bg-white flex flex-col justify-center gap-3 px-6 pt-5 pb-5 md:px-8 md:pt-5 md:pb-5"
            >
              <AuthCloseButton onClick={handleClose} />

              <div className="flex flex-col gap-3 w-full items-center">
                <MainAppLogo width={130} />

                <AuthIllustration name="otp-phone" assetBase={assetBase} />

                <div className="flex flex-col gap-1 w-full items-center text-center">
                  <h2
                    id="auth-otp-title"
                    className="heading-medium !font-bold text-[var(--color-text-gray-normal)]"
                  >
                    Enter OTP
                  </h2>
                  <p className="body-large !font-normal text-[var(--color-text-gray-subtle)]">
                    We&apos;ve sent a {OTP_LENGTH}-digit OTP to
                  </p>
                  <p className="flex items-center gap-2 body-large !font-semibold text-[var(--color-text-gray-normal)]">
                    +91 {phone.slice(0, 5)} {phone.slice(5)}
                    <button
                      type="button"
                      onClick={goToLogin}
                      aria-label="Edit mobile number"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-brand)] hover:bg-[var(--color-input-primary-soft)]"
                    >
                      <PencilIcon />
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full items-center">
                {/* OTP Input */}
                <div className="w-full">
                  <MainInput
                    key={otpFieldKey}
                    // A new name too: Chrome's autofill identifies a field by
                    // its name/id, not only the DOM element.
                    name={`otp-${otpFieldKey}`}
                    id={`otp-${otpFieldKey}`}
                    ref={inputRef}
                    appearance="outlined"
                    icon={
                      <span className="text-[var(--color-text-gray-subtle)]">
                        <KeyIcon />
                      </span>
                    }
                    error={error}
                    value={otp}
                    placeholder={`Enter ${OTP_LENGTH}-digit OTP`}
                    aria-label={`${OTP_LENGTH}-digit OTP`}
                    className="h-[52px]"
                    inputClassName="body-large !font-normal text-[var(--color-text-gray-normal)]"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtp(val);
                      if (val.length === OTP_LENGTH) handleVerify(val);
                    }}
                    inputType="phone"
                    maxLength={OTP_LENGTH}
                    autoComplete="one-time-code"
                    showError={false}
                  />
                  {/* error — always reserved so the sheet does not jump */}
                  <p
                    role={error ? "alert" : undefined}
                    className={`mt-1 min-h-[1.25rem] text-sm w-full text-center ${error ? "text-red-600" : "invisible"}`}
                  >
                    {error}
                  </p>
                </div>

                {/* Resend */}
                <p className="body-medium !font-normal text-[var(--color-text-gray-subtle)] text-center">
                  Didn&apos;t receive OTP?{" "}
                  {resendingOtp ? (
                    <span className="text-[var(--color-brand)]">Resending OTP...</span>
                  ) : resendTimer > 0 ? (
                    <span className="!font-medium text-[var(--color-brand)]">
                      Resend in 00:{String(resendTimer).padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="!font-medium text-[var(--color-brand)] underline-offset-2 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>

                {/* Button */}
                <Button
                  size="lg"
                  sx={{ borderRadius: "50px" }}
                  fullWidth
                  disabled={otp.length !== OTP_LENGTH || loading}
                  loading={loading}
                  onClick={() => handleVerify()}
                >
                  {otpSubmitLabel}
                </Button>

                <button
                  type="button"
                  onClick={goToLogin}
                  className="flex items-center gap-2 body-medium !font-medium text-[var(--color-brand)]"
                >
                  <ArrowLeftIcon />
                  Change Number
                </button>
              </div>
            </div>
          </Container>
        )}
      </AnimatePresence>
    );
  }

  return OTPScreen;
}
