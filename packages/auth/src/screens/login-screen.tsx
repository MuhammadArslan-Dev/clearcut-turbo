"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import MainInput from "@clearcut/ui/main-input";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";

import { DrawerSheet } from "../ui/drawer-sheet";
import { Modal } from "../ui/modal";
import MainAppLogo from "../icons/main-app-logo";
import FireIcon from "../icons/fire-icon";
import WhatsappIcon from "../icons/whatsapp-icon";
import { useBackHandler } from "@clearcut/hooks/use-back-handler";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { highlightTextUtil } from "@clearcut/utils/highlight-text";
import {
  INDIAN_MOBILE_REGEX as PHONE_REGEX,
  INDIAN_MOBILE_FIRST_DIGIT_REGEX as FIRST_DIGIT_REGEX,
  isFakeMobileNumber as isFakeNumber,
} from "../validators";
import { setToken } from "../token";
import { buildPostVerifyRedirectUrl } from "../redirect";
import { useTruecallerLogin } from "../truecaller";
import { identifyClarityUser } from "@clearcut/analytics/clarity";
import type { CreateOtpScreenOptions } from "./otp-screen";

const FAKE_NUMBER_ERROR = "Enter only a real mobile number";

// Same wa.me pre-filled-chat pattern as apps/landing's StartAuthForm — pure
// frontend, no backend call. An n8n automation watching this WhatsApp number
// handles everything past the user tapping send (identify sender, create/
// look up account, reply with a login link).
const WHATSAPP_NUMBER = "917404758398";
const WHATSAPP_DEFAULT_MESSAGE = "Hi, I want to login to Clear Cutoff";

// Generic placeholder mark — swap for Truecaller's actual brand icon
// (subject to their brand guidelines) if this becomes visible.
function TruecallerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#0087FF" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fontFamily="inherit"
        fill="#fff"
      >
        T
      </text>
    </svg>
  );
}

/**
 * 1:1 port of apps/landing's former login-screen.tsx, parameterized by the
 * app's authApi/stores/analytics instead of importing them directly.
 */
export function createLoginScreen({
  authApi,
  useAuthStore,
  onEvent,
  redirectBaseUrl,
}: CreateOtpScreenOptions) {
  function LoginScreen() {
    const {
      phone,
      setPhone,
      startLogin,
      loginSuccess,
      loading,
      screen,
      userId,
      setUserId,
      setScreen,
      setLoading,
      marketing,
    } = useAuthStore();

    const isMobile = useIsMobile();
    const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

    /* ---------------- LOCAL STATE ---------------- */

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isValidPhone, setIsValidPhone] = useState(false);
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    const hasTrackedRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    /* ---------------- TRUECALLER ---------------- */

    const {
      state: truecallerState,
      error: truecallerError,
      start: startTruecallerLogin,
    } = useTruecallerLogin(authApi, (result) => {
      setToken(result.token);

      const tcUser = result.user as { uuid?: string; phone?: string } | undefined;
      identifyClarityUser({ userId: tcUser?.uuid, phone: tcUser?.phone });

      const lang = localStorage.getItem("locale") || "";
      const course = localStorage.getItem("course");

      const redirectUrl = buildPostVerifyRedirectUrl({
        baseUrl: redirectBaseUrl,
        token: result.token,
        hasCourse: result.hasCourse,
        userType: "old",
        lang,
        course,
      });

      window.location.replace(redirectUrl);
    });

    const truecallerBusy = truecallerState === "opening" || truecallerState === "waiting";

    const handleWhatsAppLogin = () => {
      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
    };

    /* ---------------- ANALYTICS ---------------- */

    useEffect(() => {
      if (screen === "login" && !hasTrackedRef.current) {
        onEvent?.("Authentication Options Viewed", {
          initial_intent: "login",
          options_available: "phone",
        });

        onEvent?.("Authentication Method Selected", {
          auth_method: "phone_otp",
        });

        hasTrackedRef.current = true;
      }

      if (screen !== "login") {
        hasTrackedRef.current = false;
      }

      if (screen === "login") {
        // Small delay ensures modal + animation mounted
        const id = setTimeout(() => {
          inputRef.current?.focus();
        }, 150);

        return () => clearTimeout(id);
      }
    }, [screen]);

    /* ---------------- PHONE VALIDATION ---------------- */

    const validatePhone = (value: string) => {
      const cleaned = value.replace(/\D/g, "");

      setPhone(cleaned);
      setAutoSubmitted(false);

      // Empty
      if (!cleaned.length) {
        setError("");
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // First digit invalid
      if (cleaned.length === 1 && !FIRST_DIGIT_REGEX.test(cleaned)) {
        setError("Phone number must start with 6, 7, 8, or 9");
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // Country code detection: "91" followed by a valid phone start digit (6-9)
      // Only warn while still typing (< 10 digits); at 10 digits let PHONE_REGEX decide
      if (
        cleaned.length >= 2 &&
        cleaned.length < 10 &&
        cleaned.startsWith("91") &&
        (cleaned.length === 2 || /^[6-9]$/.test(cleaned[2]))
      ) {
        setError("Don't include 91 in number");
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // Less than 10 digits
      if (cleaned.length < 10) {
        setError("Enter valid 10-digit phone number");
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // More than 10 digits
      if (cleaned.length > 10) {
        setError("Phone number cannot exceed 10 digits");
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // Fake / bogus number — block before any OTP request goes out
      if (PHONE_REGEX.test(cleaned) && isFakeNumber(cleaned)) {
        setError(FAKE_NUMBER_ERROR);
        setSuccess("");
        setIsValidPhone(false);
        return;
      }

      // Valid
      if (PHONE_REGEX.test(cleaned)) {
        setSuccess("Valid phone number");
        setError("");
        setIsValidPhone(true);
        return;
      }

      // Fallback
      setError("Invalid phone number");
      setSuccess("");
      setIsValidPhone(false);
    };

    /* ---------------- AUTO SUBMIT ---------------- */

    useEffect(() => {
      if (isValidPhone && phone.length === 10 && !autoSubmitted) {
        setAutoSubmitted(true);

        setTimeout(() => {
          handleLogin();
        }, 100);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isValidPhone, phone]);

    /* ---------------- LOGIN ---------------- */

    const handleLogin = async (phoneValue?: string) => {
      const number = phoneValue ?? phone;

      if (!PHONE_REGEX.test(number)) {
        setError("Enter valid phone number");
        return;
      }

      // Never send an OTP request for a fake number
      if (isFakeNumber(number)) {
        setError(FAKE_NUMBER_ERROR);
        setIsValidPhone(false);
        return;
      }

      setError("");
      setSuccess("");
      startLogin();

      try {
        // Sends back the previous attempt's user_id, when there is one, so
        // the backend can correct that pending (unverified) row's phone
        // instead of leaving it behind as an orphan account and inserting a
        // new one — see AuthController::login's `user_id` handling.
        const res = await authApi.loginUser({
          phone: number,
          user_id: userId || undefined,
        });
        const { data, message } = res?.data;

        // fire-and-forget — don't block OTP screen on analytics
        onEvent?.("Verification Sent", {
          phone: number,
          verification_method: "Number",
          verification_mode: "SMS",
          verification_purpose: "Login",
        });

        localStorage.setItem("is_new_user", data?.is_new_user ? "true" : "false");

        setSuccess(message);
        // The backend only echoes `user_id` back for a genuinely new signup
        // (AuthController::login) — an update to an already-known pending
        // row returns none. Fall back to the id already held instead of
        // blanking it out, so a 2nd+ correction on the same pending row
        // still carries it forward (and stays persisted — see auth-store.ts).
        setUserId(data?.user_id ?? userId);

        setTimeout(loginSuccess, 200);
      } catch {
        setLoading(false);
        setError("Login failed. Please try again.");
      }
    };

    const closeModal = useCallback(() => {
      setScreen("register");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------------- BACK HANDLER ---------------- */

    useBackHandler({
      isOpen: screen === "login",
      onClose: () => {
        closeModal();
      },
    });
    /* ---------------- RENDER ---------------- */

    return (
      <AnimatePresence>
        {screen === "login" && (
          <Container
            isOpen
            onClose={() => {
              closeModal();
            }}
            maxWidth="md:max-w-[400px]"
          >
            <div className="h-full bg-white flex flex-col justify-between md:justify-center md:gap-6 pb-10 pt-7 md:pt-3 md:pb-6">
              <div className="flex flex-col gap-4 w-full px-7 md:px-10">
                <div className="flex justify-center w-full">
                  <MainAppLogo width={140} />
                </div>

                <div className="flex flex-col gap-8 w-full items-center">
                  <div className="flex flex-col gap-1 w-full items-center">
                    <h6 className="heading-medium !font-semibold text-[var(--color-text-gray-normal)]">
                      Start your exam preparation
                    </h6>
                    <p className="body-medium !font-normal text-[var(--color-text-gray-subtle)]">
                      Videos • Notes • PYQs
                    </p>
                  </div>

                  {/* Timer */}
                  {marketing === "course-marketing" && <SeatTimer />}

                  <div className="flex flex-col gap-8 w-full items-center overflow-hidden">
                    <div className="flex flex-col gap-5 w-full items-center">
                      {/* Truecaller only works via its app deep-link —
                          desktop has no app to hand off to, so this row (and
                          its OR divider) only render below the md
                          breakpoint. */}
                      <div className="flex md:hidden flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outlined"
                            sx={{ borderRadius: "50px" }}
                            className="!bg-brand/5 hover:!bg-brand/10 !border-[#0087FF]/30 shadow-sm"
                            fullWidth
                            onClick={startTruecallerLogin}
                            disabled={truecallerBusy}
                            loading={truecallerBusy}
                            leftIcon={<TruecallerIcon />}
                          >
                            {truecallerState === "waiting" ? "Waiting…" : "Truecaller"}
                          </Button>

                          {/* "Login with WhatsApp" — logic is fully wired
                              (handleWhatsAppLogin, the wa.me deep link), just
                              not shown yet. Uncomment to go live. */}
                          {/* <Button
                            size="sm"
                            variant="outlined"
                            sx={{ borderRadius: "50px" }}
                            className="!bg-[#25D366]/5 hover:!bg-[#25D366]/10 !border-[#25D366]/30 shadow-sm"
                            fullWidth
                            onClick={handleWhatsAppLogin}
                            leftIcon={<WhatsappIcon size={20} color="#25D366" />}
                          >
                            WhatsApp
                          </Button> */}
                        </div>

                        {truecallerState === "unavailable" && (
                          <p className="text-sm text-center text-[var(--color-text-gray-muted)]">
                            Truecaller app not found — continue below
                          </p>
                        )}
                        {truecallerState === "error" && truecallerError && (
                          <p className="text-sm text-center text-red-600">{truecallerError}</p>
                        )}

                        <div className="flex items-center gap-3 py-1 w-full">
                          <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                          <Text as="span" variant="body-small" color="gray-muted">
                            OR
                          </Text>
                          <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                        </div>
                      </div>

                      {/* INPUT */}
                      <div className="space-y-4 w-full">
                        <div className="flex gap-3 items-center">
                          <Image
                            src="/images/indian-flage.webp"
                            alt="Indian flag"
                            width={24}
                            height={24}
                            priority
                            unoptimized
                          />
                          <p className="body-small !font-semibold text-[var(--color-text-gray-subtle)]">
                            Mobile or WhatsApp Number
                          </p>
                        </div>

                        <div className="flex gap-0 flex-col w-full items-center">
                          <div className="w-full flex items-center gap-2">
                            <div className="w-full h-[48px] relative">
                              <MainInput
                                ref={inputRef}
                                value={phone}
                                placeholder="10-digit number"
                                inputType="phone"
                                error={error}
                                maxLength={10}
                                className="h-full"
                                inputClassName="body-large !font-normal text-[var(--color-text-gray-normal)]"
                                onChange={(e) => validatePhone(e.target.value)}
                                inputPrefix="+91 -"
                                showError={false}
                              />
                              {phone.length > 0 && (
                                <span className="absolute left-1/4 -translate-x-1/2 top-0 -translate-y-1/2 text-xs text-[var(--color-gray-blue)] bg-white rounded-full border border-[var(--color-gray-blue)] px-2.5 py-0.5 pointer-events-none select-none whitespace-nowrap">
                                  10-digit number
                                </span>
                              )}
                            </div>
                          </div>

                          {/* error or success — always rendered to prevent layout shift */}
                          <p
                            className={`text-sm w-full text-center min-h-[1.5rem] ${error ? "text-red-600" : success ? "text-green-600" : "invisible"}`}
                          >
                            {error || success}
                          </p>

                          <div className="text-center mt-2 body-small !font-normal text-[var(--color-surface-gray-muted)]">
                            <p>
                              <em>
                                Used only for login & exam updates. No spam.
                              </em>
                            </p>
                            <p>
                              <em>OTP will be sent via SMS and WhatsApp.</em>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BUTTON */}
                      <div className="w-full flex justify-center">
                        <div className="max-w-[328px] w-full">
                          <Button
                            size="lg"
                            sx={{ borderRadius: "50px" }}
                            fullWidth
                            onClick={() => handleLogin()}
                            disabled={!isValidPhone || loading}
                            loading={loading}
                          >
                            Start FREE Preparation
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* TRIAL */}
                    {marketing === "course-marketing" ? (
                      <></>
                    ) : (
                      <div className="flex flex-col w-full items-center gap-1">
                        <div className="max-w-[150px] px-3 py-0.5 text-[var(--color-brand-dark-legacy)] body-medium !font-semibold border border-[var(--color-brand)] bg-[var(--color-brand)]/9 rounded-full">
                          3-day FREE Trial
                        </div>

                        <div className="flex items-center gap-1 text-[var(--color-surface-gray-muted)]">
                          <FireIcon variant="outline" size={16} />
                          <p className="body-small !font-normal text-[var(--color-text-gray-muted)]">
                            No card or payment required
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TRUST TEXT */}
                  <div className="block md:hidden text-center body-medium !font-normal text-[var(--color-surface-gray-muted)]">
                    {highlightTextUtil(
                      `Trusted by 10,000+ students to clear TET exams across India`,
                      ["10,000"],
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="text-center px-4 body-medium !font-normal text-[var(--color-surface-gray-muted)]">
                {highlightTextUtil(
                  `By Signing Up, I agree to Terms & Conditions and Privacy Policy.`,
                  ["Terms & Conditions", "Privacy Policy"],
                )}
              </div>
            </div>
          </Container>
        )}
      </AnimatePresence>
    );
  }

  return LoginScreen;
}

export function SeatTimer() {
  const [seats] = useState(8);
  const [timeLeft, setTimeLeft] = useState(480); // 2 min

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-14 -my-4">
      {/* Remaining Seats */}
      <div className="text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-md border-2 border-red-400 bg-white  shadow-sm">
          <Text variant="body-large" weight="semibold" className="!text-red-600">
            {seats}
          </Text>
        </div>
        <Text variant="body-small" color="gray-muted">
          Remaining seats
        </Text>
      </div>

      {/* Timer */}
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md border-2 border-red-400 bg-white  shadow-sm">
            <Text variant="body-large" weight="semibold" className="!text-red-600">
              {minutes}
            </Text>
          </div>
          <span className="text-red-400 text-3xl font-bold">:</span>
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md border-2 border-red-400 bg-white  shadow-sm">
            <Text variant="body-large" weight="semibold" className="!text-red-600">
              {seconds}
            </Text>
          </div>
        </div>
        <Text variant="body-small" color="gray-muted">
          Remaining login time
        </Text>
      </div>
    </div>
  );
}
