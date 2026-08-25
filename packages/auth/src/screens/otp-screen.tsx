"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import MainInput from "@clearcut/ui/main-input";
import { AnimatePresence } from "framer-motion";

import { DrawerSheet } from "../ui/drawer-sheet";
import { Modal } from "../ui/modal";
import { useBackHandler } from "@clearcut/hooks/use-back-handler";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { useWebOtpAutofill } from "../use-web-otp-autofill";
import { setToken } from "../token";
import { buildPostVerifyRedirectUrl } from "../redirect";
import { trackFacebookLead } from "../facebook-pixel";
import { identifyClarityUser } from "@clearcut/analytics/clarity";
import MainAppLogo from "../icons/main-app-logo";
import RetryIcon from "../icons/retry-icon";
import type { AuthScreenDeps } from "./types";

const OTP_LENGTH = 4;
const RESEND_INTERVAL = 30;

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12.0026 18.26L4.9491 22.2082L6.52443 14.2799L0.589844 8.7918L8.61688 7.84006L12.0026 0.5L15.3882 7.84006L23.4152 8.7918L17.4807 14.2799L19.056 22.2082L12.0026 18.26Z"
      fill="#FECF49"
    />
  </svg>
);

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
  redirectBaseUrl,
}: CreateOtpScreenOptions) {
  function OTPScreen() {
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
      verifyOtpSuccess,
      screen,
      loading,
      setScreen,
      setLoading,
    } = useAuthStore();

    const [error, setError] = useState("");
    const [resendingOtp, setResendingOtp] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_INTERVAL);

    const isVerifyingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

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

    useWebOtpAutofill((code) => {
      setOtp(code);
      handleVerify(code);
    }, screen === "otp");

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

      try {
        const lang = localStorage.getItem("locale") || "";
        const course = localStorage.getItem("course");

        const res = await authApi.verifyOtp({ phone, otp: finalOtp });
        const { data, status } = res.data;

        if (status !== "success") throw new Error("Verification failed");

        setToken(data.token);
        // Verified now — no longer a "pending" row a future refresh should
        // try to reuse/update (also clears the persisted localStorage copy).
        setUserId("");
        trackFacebookLead(
          localStorage.getItem("is_new_user") === "true",
          phone,
          userId,
        );
        identifyClarityUser({ userId, phone });

        const redirectUrl = buildPostVerifyRedirectUrl({
          baseUrl: redirectBaseUrl,
          token: data.token,
          hasCourse: data.has_course,
          userType: "old",
          lang,
          course,
        });

        window.location.replace(redirectUrl);
        verifyOtpSuccess();
      } catch (err: unknown) {
        setLoading(false);
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 422 || status === 401) {
          setError("Invalid or expired OTP. Please try again.");
        } else if (status && status >= 500) {
          setError("Server error. Please try again.");
        } else if (!navigator.onLine) {
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

        await onEvent?.("Verification Resent", {
          verification_method: "Number",
          resend_count: 1,
        });
      } catch (err) {
        console.error("Resend OTP failed", err);
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
            <div className="h-full bg-white flex flex-col gap-10 pb-10 pt-7 md:pt-3 md:pb-6 px-4">
              {/* Header */}
              <div className="flex flex-col gap-4 items-center justify-center w-full px-4">
                <MainAppLogo width={140} />

                <div className="flex flex-col gap-1 items-center">
                  <div className="flex gap-0.5 w-full justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>

                  <p className="text-center body-medium !font-normal text-[var(--color-surface-gray-subtle)]">
                    Rated 4.9 stars by 10,000+ students
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-6 w-full items-center">
                {/* Phone */}
                <p className="body-large !font-normal text-[var(--color-text-gray-subtle)]">
                  OTP sent to{" "}
                  <span className="!font-semibold text-[var(--color-text-gray-normal)]">
                    {phone}
                  </span>{" "}
                  <span
                    onClick={goToLogin}
                    className="!font-semibold text-[var(--color-brand)] cursor-pointer"
                  >
                    Edit
                  </span>
                </p>

                {/* OTP Input */}
                <div className="w-[240px]">
                  <p className="body-small !font-semibold text-[var(--color-text-gray-subtle)] mb-1">
                    4-digit OTP <span className="text-red-500 text-md">*</span>
                  </p>

                  <div>
                    <MainInput
                      ref={inputRef}
                      error={error}
                      value={otp}
                      placeholder="4 digit OTP"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setOtp(val);
                        if (val.length === OTP_LENGTH) handleVerify(val);
                      }}
                      inputType="phone"
                      maxLength={OTP_LENGTH}
                    />
                  </div>
                  {/* error or success */}
                  {error && (
                    <p
                      className={`text-sm w-full text-left max-w-[335px] ${error ? "text-red-600" : "text-green-600"}`}
                    >
                      {error}
                    </p>
                  )}
                  <Text
                    as="p"
                    variant="body-small"
                    color="gray-muted"
                    className="text-center mt-2"
                  >
                    <em>Sent via SMS and WhatsApp</em>{" "}
                  </Text>
                </div>

                {/* Resend */}
                <div>
                  {resendingOtp ? (
                    <p className="body-medium !font-normal text-[var(--color-brand)]">
                      Resending OTP...
                    </p>
                  ) : (
                    <div className="flex items-center gap-1">
                      <RetryIcon color="var(--color-brand)" />
                      <p
                        className={`body-medium !font-normal text-[var(--color-brand)] ${
                          resendTimer > 0
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={handleResendOtp}
                      >
                        {resendTimer > 0
                          ? `Resend OTP (${resendTimer}s)`
                          : "Resend OTP"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Button */}
                <div className="w-[280px]">
                  <Button
                    size="lg"
                    sx={{ borderRadius: "50px" }}
                    fullWidth
                    disabled={otp.length !== OTP_LENGTH || loading}
                    loading={loading}
                    onClick={() => handleVerify()}
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        )}
      </AnimatePresence>
    );
  }

  return OTPScreen;
}
