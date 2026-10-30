"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import MainInput from "@clearcut/ui/main-input";
import { AnimatePresence } from "framer-motion";

import { DrawerSheet } from "../ui/drawer-sheet";
import {
  getAuthFailureReason,
  trackVerificationFailed,
  trackVerificationSent,
} from "../verification-events";
import { Modal } from "../ui/modal";
import { TruecallerButton } from "../ui/truecaller-button";
import MainAppLogo from "../icons/main-app-logo";
import ShieldCheckIcon from "../icons/shield-check-icon";
import {
  AuthCloseButton,
  AuthIllustration,
  ArrowRightIcon,
  FeatureChip,
  GiftIcon,
  IndiaPhonePrefix,
} from "../ui/auth-sheet-parts";
import { useBackHandler } from "@clearcut/hooks/use-back-handler";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { highlightTextUtil } from "@clearcut/utils/highlight-text";
import {
  INDIAN_MOBILE_REGEX as PHONE_REGEX,
  INDIAN_MOBILE_FIRST_DIGIT_REGEX as FIRST_DIGIT_REGEX,
  isFakeMobileNumber as isFakeNumber,
  normalizeIndianMobileInput,
} from "../validators";
import { setToken } from "../token";
import { buildPostVerifyRedirectUrl, getCurrentLocale } from "../redirect";
import { useTruecallerLogin, useTruecallerAvailability } from "../truecaller";
import { identifyClarityUser } from "@clearcut/analytics/clarity";
import type { CreateOtpScreenOptions } from "./otp-screen";
import type { LoginCopy } from "./types";

const FAKE_NUMBER_ERROR = "Enter only a real mobile number";

// Same wa.me pre-filled-chat pattern as apps/landing's StartAuthForm — pure
// frontend, no backend call. An n8n automation watching this WhatsApp number
// handles everything past the user tapping send (identify sender, create/
// look up account, reply with a login link).
const WHATSAPP_NUMBER = "917404758398";
const WHATSAPP_DEFAULT_MESSAGE = "Hi, I want to login to Clear Cutoff";

/**
 * 1:1 port of apps/landing's former login-screen.tsx, parameterized by the
 * app's authApi/stores/analytics instead of importing them directly.
 */
export function createLoginScreen({
  authApi,
  useAuthStore,
  onEvent,
  onIdentify,
  redirectBaseUrl,
  onAuthenticated,
  assetBase,
}: CreateOtpScreenOptions) {
  function LoginScreen({ loginCopy }: { loginCopy?: LoginCopy }) {
    const title = loginCopy?.title ?? "Start your exam preparation";
    const subtitle =
      loginCopy?.subtitle === undefined ? "Videos • Notes • PYQs" : loginCopy.subtitle;
    const submitLabel = loginCopy?.submitLabel ?? "Start FREE Preparation";
    const showTrialBanner = loginCopy?.showTrialBanner ?? true;
    const showTrustText = loginCopy?.showTrustText ?? true;
    const illustration = loginCopy?.illustration === undefined ? "study" : loginCopy.illustration;
    const featureChips = loginCopy?.featureChips;

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
      course,
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

    const truecallerAvailability = useTruecallerAvailability();

    const {
      state: truecallerState,
      error: truecallerError,
      start: startTruecallerLogin,
    } = useTruecallerLogin(authApi, (result) => {
      setToken(result.token);

      const tcUser = result.user as { uuid?: string; phone?: string } | undefined;
      identifyClarityUser({ userId: tcUser?.uuid, phone: tcUser?.phone });

      // Stay-on-page mode — see the same branch in otp-screen.tsx.
      if (onAuthenticated) {
        setLoading(false);
        setScreen("register");
        onAuthenticated({
          token: result.token,
          hasCourse: result.hasCourse,
          isNewUser: false,
          source: "truecaller",
        });
        return;
      }

      const lang = getCurrentLocale();

      const redirectUrl = buildPostVerifyRedirectUrl({
        baseUrl: redirectBaseUrl,
        token: result.token,
        hasCourse: result.hasCourse,
        userType: "old",
        lang,
        course,
      });

      window.location.replace(redirectUrl);
    }, onEvent);

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
      const cleaned = normalizeIndianMobileInput(value);

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

      // The button stays tappable (CC-84): a tap with a missing or wrong
      // number shows why under the field instead of silently doing nothing.
      if (!PHONE_REGEX.test(number)) {
        setError(number ? error || "Enter valid phone number" : "Enter your 10-digit mobile number");
        setSuccess("");
        inputRef.current?.focus();
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
        trackVerificationSent(onEvent, number);
        // Brand-new signup only: the row was just created for this browser, so
        // linking it now is safe and lets first-touch UTM reach the user before
        // the server-side Signed Up event. Existing accounts are identified only
        // after a successful verify (see otp-screen).
        if (data?.is_new_user && data?.user_id) onIdentify?.(data.user_id);

        localStorage.setItem("is_new_user", data?.is_new_user ? "true" : "false");

        setSuccess(message);
        // The backend only echoes `user_id` back for a genuinely new signup
        // (AuthController::login) — an update to an already-known pending
        // row returns none. Fall back to the id already held instead of
        // blanking it out, so a 2nd+ correction on the same pending row
        // still carries it forward (and stays persisted — see auth-store.ts).
        setUserId(data?.user_id ?? userId);

        setTimeout(loginSuccess, 200);
      } catch (err) {
        // The OTP was not sent (CC-87/D4): say why, and record it.
        const reason = getAuthFailureReason(err);
        trackVerificationFailed(onEvent, number, reason);
        setLoading(false);
        setError(
          reason === "too_many_attempts"
            ? "Too many attempts. Please wait a minute and try again."
            : reason === "network_error" || reason === "timeout"
              ? "No internet connection."
              : "Login failed. Please try again.",
        );
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
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              className="relative h-full bg-white flex flex-col justify-between md:justify-center gap-3 px-6 pt-5 pb-5 md:px-8 md:pt-5 md:pb-5"
            >
              <AuthCloseButton onClick={closeModal} />

              <div className="flex flex-col gap-3 w-full items-center">
                <MainAppLogo width={130} />

                {illustration && <AuthIllustration name={illustration} assetBase={assetBase} />}

                <div className="flex flex-col gap-1 w-full items-center text-center">
                  <h2
                    id="auth-modal-title"
                    className="heading-medium !font-bold text-[var(--color-text-gray-normal)]"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="body-medium !font-normal text-[var(--color-text-gray-subtle)]">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Timer */}
                {marketing === "course-marketing" && <SeatTimer />}

                <div className="flex flex-col gap-3 w-full items-center">
                  {/* Only rendered once useTruecallerAvailability confirms
                      the app is on this device (cached across every
                      clearcutoff.in property — see that hook's docblock).
                      TruecallerButton is shared with StartAuthForm.tsx
                      (packages/auth/src/ui/truecaller-button.tsx) — edit
                      it there to change this button anywhere it's used. */}
                  {truecallerAvailability === "available" && (
                    <div className="flex md:hidden flex-col gap-2 w-full">
                      <TruecallerButton
                        state={truecallerState}
                        error={truecallerError}
                        onClick={startTruecallerLogin}
                      />

                      <div className="flex items-center gap-3 py-1 w-full">
                        <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                        <Text as="span" variant="body-small" color="gray-muted">
                          OR
                        </Text>
                        <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                      </div>
                    </div>
                  )}

                  {/* INPUT */}
                  <div className="w-full flex flex-col gap-2">
                    <label
                      htmlFor="auth-modal-phone"
                      className="body-medium !font-semibold text-[var(--color-text-gray-normal)]"
                    >
                      Mobile or WhatsApp Number
                    </label>

                    <MainInput
                      ref={inputRef}
                      id="auth-modal-phone"
                      appearance="outlined"
                      autoComplete="tel-national"
                      normalizeValue={normalizeIndianMobileInput}
                      focusOnTap
                      value={phone}
                      placeholder="10-digit mobile number"
                      inputType="phone"
                      error={error}
                      maxLength={10}
                      className="h-[52px]"
                      inputClassName="body-large !font-normal text-[var(--color-text-gray-normal)]"
                      onChange={(e) => validatePhone(e.target.value)}
                      inputPrefix={<IndiaPhonePrefix />}
                      showError={false}
                    />

                    {/* error or success — always rendered to prevent layout shift */}
                    <p
                      role={error ? "alert" : undefined}
                      className={`text-sm w-full text-center min-h-[1.25rem] ${error ? "text-red-600" : success ? "text-green-600" : "invisible"}`}
                    >
                      {error || success}
                    </p>

                    <div className="flex items-center justify-center gap-3 body-small !font-normal text-[var(--color-text-gray-subtle)]">
                      <ShieldCheckIcon />
                      <div>
                        <p>Used only for login and exam updates. No spam.</p>
                        <p>OTP sent via SMS and WhatsApp.</p>
                      </div>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <Button
                    size="lg"
                    sx={{ borderRadius: "50px" }}
                    fullWidth
                    onClick={() => handleLogin()}
                    disabled={loading}
                    loading={loading}
                    rightIcon={<ArrowRightIcon />}
                  >
                    {submitLabel}
                  </Button>

                  {/* CONTEXT STRIP — icon chips (tools) or the trial pill (signup) */}
                  {featureChips && featureChips.length > 0 ? (
                    <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
                      {featureChips.map((chip, i) => (
                        <FeatureChip key={i} icon={chip.icon} label={chip.label} />
                      ))}
                    </div>
                  ) : marketing === "course-marketing" || !showTrialBanner ? null : (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-input-primary-soft)] px-3 py-2.5 body-small text-[var(--color-text-gray-subtle)]">
                      <span className="text-[var(--color-brand)]">
                        <GiftIcon />
                      </span>
                      <span>
                        <span className="!font-semibold text-[var(--color-brand)]">3-day FREE Trial</span>
                        {" • "}No card or payment required
                      </span>
                    </div>
                  )}
                </div>

                {/* TRUST TEXT */}
                {showTrustText && (
                  <div className="block md:hidden text-center body-medium !font-normal text-[var(--color-surface-gray-muted)]">
                    {highlightTextUtil(
                      `Trusted by 10,000+ students to clear TET exams across India`,
                      ["10,000"],
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER — absolute clearcutoff.in URLs (not relative paths):
                  this component is shared with apps/blog, which has no
                  /terms-and-conditions or /privacy-policy routes of its own
                  — only apps/landing does. Opens in a new tab so it doesn't
                  abandon this modal's in-progress phone entry. */}
              <div className="text-center body-small !font-normal text-[var(--color-surface-gray-muted)]">
                By continuing, you agree to our{" "}
                <a
                  href="https://clearcutoff.in/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-2.5 -my-2.5 text-[var(--color-brand)] font-medium"
                >
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a
                  href="https://clearcutoff.in/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-2.5 -my-2.5 text-[var(--color-brand)] font-medium"
                >
                  Privacy Policy
                </a>
                .
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
