"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import MainInput from "@clearcut/ui/main-input";
import OtpBoxInput from "./OtpBoxInput";
import Image from "next/image";
import { Link } from "@clearcut/i18n/navigation";
import { authApi } from "@/lib/auth";
import { logAmplitudeEvent } from "@/services/analytics";
import { IMAGES } from "@/constants/images";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import {
  INDIAN_MOBILE_REGEX as PHONE_REGEX,
  INDIAN_MOBILE_FIRST_DIGIT_REGEX as FIRST_DIGIT_REGEX,
  isFakeMobileNumber as isFakeNumber,
} from "@clearcut/auth/validators";
import { setToken } from "@clearcut/auth/token";
import { buildPostVerifyRedirectUrl } from "@clearcut/auth/redirect";
import { trackFacebookLead } from "@clearcut/auth/facebook-pixel";
import { useWebOtpAutofill } from "@clearcut/auth/use-web-otp-autofill";

const OTP_LENGTH = 4;
const RESEND_INTERVAL = 30;
const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in";

const CONTENT: Record<
  Locale,
  {
    subheading: string;
    otpHint: string;
    terms: string;
    mobileLabel: string;
    phonePlaceholder: string;
    continueBtn: string;
    verifyHeading: string;
    otpSentTo: string;
    editLabel: string;
    otpLabel: string;
    resendingOtp: string;
    resendOtpTimer: string;
    resendOtp: string;
    verifyOtpBtn: string;
    trialTitle: string;
    trialSubtitle: string;
    errStartDigit: string;
    errNo91: string;
    errValid10: string;
    errMax10: string;
    errFakeNumber: string;
    successValidPhone: string;
    errInvalidPhone: string;
    errEnterValidPhone: string;
    errLoginFailed: string;
    errEnterValidOtp: string;
    errOtpInvalid: string;
    errServer: string;
    errNoInternet: string;
    errGeneric: string;
  }
> = {
  en: {
    subheading: "Login or sign up to continue your exam preparation journey",
    otpHint: "We will send you an OTP to verify your number",
    terms: "By continuing, you agree to our",
    mobileLabel: "Mobile or WhatsApp Number",
    phonePlaceholder: "10-digit number",
    continueBtn: "Continue",
    verifyHeading: "Verify your number",
    otpSentTo: "OTP sent to",
    editLabel: "Edit",
    otpLabel: "4-digit OTP",
    resendingOtp: "Resending OTP...",
    resendOtpTimer: "Resend OTP ({seconds}s)",
    resendOtp: "Resend OTP",
    verifyOtpBtn: "Verify OTP",
    trialTitle: "3-day FREE Trial",
    trialSubtitle: "No card or payment required",
    errStartDigit: "Phone number must start with 6, 7, 8, or 9",
    errNo91: "Don't include 91 in number",
    errValid10: "Enter valid 10-digit phone number",
    errMax10: "Phone number cannot exceed 10 digits",
    errFakeNumber: "Enter only a real mobile number",
    successValidPhone: "Valid phone number",
    errInvalidPhone: "Invalid phone number",
    errEnterValidPhone: "Enter valid phone number",
    errLoginFailed: "Login failed. Please try again.",
    errEnterValidOtp: "Enter valid OTP",
    errOtpInvalid: "Invalid or expired OTP. Please try again.",
    errServer: "Server error. Please try again.",
    errNoInternet: "No internet connection.",
    errGeneric: "Something went wrong. Please try again.",
  },
  hi: {
    subheading: "अपनी परीक्षा की तैयारी जारी रखने के लिए लॉगिन या साइन अप करें",
    otpHint: "आपके नंबर को वेरीफाई करने के लिए हम एक OTP भेजेंगे",
    terms: "जारी रखकर, आप हमारी",
    mobileLabel: "मोबाइल या व्हाट्सएप नंबर",
    phonePlaceholder: "10-अंकों का नंबर",
    continueBtn: "जारी रखें",
    verifyHeading: "अपना नंबर सत्यापित करें",
    otpSentTo: "OTP भेजा गया",
    editLabel: "संपादित करें",
    otpLabel: "4-अंकों का OTP",
    resendingOtp: "OTP फिर से भेजा जा रहा है...",
    resendOtpTimer: "OTP फिर से भेजें ({seconds}s)",
    resendOtp: "OTP फिर से भेजें",
    verifyOtpBtn: "OTP सत्यापित करें",
    trialTitle: "3-दिन का मुफ़्त ट्रायल",
    trialSubtitle: "कोई कार्ड या भुगतान आवश्यक नहीं",
    errStartDigit: "फ़ोन नंबर 6, 7, 8, या 9 से शुरू होना चाहिए",
    errNo91: "नंबर में 91 शामिल न करें",
    errValid10: "मान्य 10-अंकों का फ़ोन नंबर दर्ज करें",
    errMax10: "फ़ोन नंबर 10 अंकों से अधिक नहीं हो सकता",
    errFakeNumber: "केवल असली मोबाइल नंबर दर्ज करें",
    successValidPhone: "मान्य फ़ोन नंबर",
    errInvalidPhone: "अमान्य फ़ोन नंबर",
    errEnterValidPhone: "मान्य फ़ोन नंबर दर्ज करें",
    errLoginFailed: "लॉगिन विफल रहा। कृपया पुनः प्रयास करें।",
    errEnterValidOtp: "मान्य OTP दर्ज करें",
    errOtpInvalid: "अमान्य या समाप्त हो चुका OTP। कृपया पुनः प्रयास करें।",
    errServer: "सर्वर त्रुटि। कृपया पुनः प्रयास करें।",
    errNoInternet: "इंटरनेट कनेक्शन नहीं है।",
    errGeneric: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
  },
};

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3z"
        fill="var(--color-brand)"
        fillOpacity="0.1"
        stroke="var(--color-brand)"
        strokeWidth="1.3"
      />
      <path
        d="M8.5 12l2.3 2.3L15.5 9.5"
        stroke="var(--color-brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Interactive right panel — the only client-rendered part of /start.
 * Same validation, same authApi calls, same analytics event names, same
 * Meta Lead tracking, same redirect builder as the login modal
 * (packages/auth's login-screen.tsx + otp-screen.tsx) — this is a visual
 * restyle only, no behavior change.
 *
 * Deliberately does NOT touch the shared useAuthStore: that store is a
 * singleton also driving the globally-mounted <AuthModal/> (rendered in the
 * root layout), so setting its `screen` field here would pop the modal open
 * on top of this page. Local state instead — same pattern already used by
 * InlineAuthFlow for exactly this reason (see its own file header).
 */
export default function StartAuthForm({ locale = defaultLocale }: { locale?: Locale }) {
  const t = CONTENT[locale];
  const otherLocale = locale === "en" ? "hi" : "en";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_INTERVAL);

  const hasTrackedRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- ANALYTICS (same event names as login-screen.tsx) ---------------- */

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    logAmplitudeEvent("Authentication Options Viewed", {
      initial_intent: "login",
      options_available: "phone",
    });
    logAmplitudeEvent("Authentication Method Selected", {
      auth_method: "phone_otp",
    });
  }, []);

  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  /* ---------------- PHONE VALIDATION (verbatim from login-screen.tsx) ---------------- */

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");

    setPhone(cleaned);
    setAutoSubmitted(false);

    if (!cleaned.length) {
      setError("");
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length === 1 && !FIRST_DIGIT_REGEX.test(cleaned)) {
      setError(t.errStartDigit);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (
      cleaned.length >= 2 &&
      cleaned.length < 10 &&
      cleaned.startsWith("91") &&
      (cleaned.length === 2 || /^[6-9]$/.test(cleaned[2]))
    ) {
      setError(t.errNo91);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length < 10) {
      setError(t.errValid10);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (cleaned.length > 10) {
      setError(t.errMax10);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (PHONE_REGEX.test(cleaned) && isFakeNumber(cleaned)) {
      setError(t.errFakeNumber);
      setSuccess("");
      setIsValidPhone(false);
      return;
    }

    if (PHONE_REGEX.test(cleaned)) {
      setSuccess(t.successValidPhone);
      setError("");
      setIsValidPhone(true);
      return;
    }

    setError(t.errInvalidPhone);
    setSuccess("");
    setIsValidPhone(false);
  };

  useEffect(() => {
    if (isValidPhone && phone.length === 10 && !autoSubmitted) {
      setAutoSubmitted(true);
      setTimeout(() => handleLogin(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidPhone, phone]);

  /* ---------------- LOGIN ---------------- */

  const handleLogin = async (phoneValue?: string) => {
    const number = phoneValue ?? phone;

    if (!PHONE_REGEX.test(number)) {
      setError(t.errEnterValidPhone);
      return;
    }

    if (isFakeNumber(number)) {
      setError(t.errFakeNumber);
      setIsValidPhone(false);
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await authApi.loginUser({ phone: number });
      const { data, message } = res?.data;

      logAmplitudeEvent("Verification Sent", {
        phone: number,
        verification_method: "Number",
        verification_mode: "SMS",
        verification_purpose: "Login",
      });

      localStorage.setItem("is_new_user", data?.is_new_user ? "true" : "false");
      setIsNewUser(Boolean(data?.is_new_user));
      setUserId(data?.user_id ?? "");
      setSuccess(message);

      setResendTimer(RESEND_INTERVAL);
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
      }, 200);
    } catch {
      setLoading(false);
      setError(t.errLoginFailed);
    }
  };

  /* ---------------- RESEND TIMER ---------------- */

  useEffect(() => {
    if (step !== "otp") return;
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setResendingOtp(true);
    try {
      await authApi.loginUser({ phone });
      setResendTimer(RESEND_INTERVAL);

      logAmplitudeEvent("Verification Resent", {
        verification_method: "Number",
        resend_count: 1,
      });
    } catch (err) {
      console.error("Resend OTP failed", err);
    } finally {
      setResendingOtp(false);
    }
  };

  const handleEditNumber = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setSuccess("");
  };

  /* ---------------- VERIFY ---------------- */

  const handleVerify = async (autoOtp?: string) => {
    if (isVerifyingRef.current) return;

    const finalOtp = autoOtp || otp;
    if (!finalOtp || finalOtp.length !== OTP_LENGTH) {
      setError(t.errEnterValidOtp);
      return;
    }

    isVerifyingRef.current = true;
    setError("");
    setLoading(true);

    try {
      const lang = localStorage.getItem("locale") || "";
      const course = localStorage.getItem("course");

      const res = await authApi.verifyOtp({ phone, otp: finalOtp });
      const { data, status } = res.data;

      if (status !== "success") throw new Error("Verification failed");

      setToken(data.token);
      trackFacebookLead(isNewUser, phone, userId);

      const redirectUrl = buildPostVerifyRedirectUrl({
        baseUrl: REDIRECT_BASE_URL,
        token: data.token,
        hasCourse: data.has_course,
        userType: "old",
        lang,
        course,
      });

      window.location.replace(redirectUrl);
    } catch (err: unknown) {
      setLoading(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 422 || status === 401) {
        setError(t.errOtpInvalid);
      } else if (status && status >= 500) {
        setError(t.errServer);
      } else if (!navigator.onLine) {
        setError(t.errNoInternet);
      } else {
        setError(t.errGeneric);
      }
    } finally {
      isVerifyingRef.current = false;
    }
  };

  useWebOtpAutofill((code) => {
    setOtp(code);
    handleVerify(code);
  }, step === "otp");

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 md:px-10 lg:px-12">
      <div className="flex justify-between items-center">
        <Link href="/" className="md:hidden">
          <Image src={IMAGES.mainLogo} alt="Clear Cutoff" width={120} height={34} priority />
        </Link>
        <Link
          href="/start"
          locale={otherLocale}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-[var(--color-brand)]/20 px-3 py-1.5 text-sm font-medium text-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand)]/8"
        >
          <GlobeIcon />
          {otherLocale === "hi" ? "हिंदी" : "English"}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-[380px] flex flex-col gap-5">
          {step === "phone" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                  {t.subheading}
                </Text>
              </div>

              <div className="space-y-2">
                <Text as="p" variant="body-small" weight="semibold" color="gray-muted">
                  {t.mobileLabel}
                </Text>

                <div className="w-full h-[52px] relative">
                  <MainInput
                    ref={phoneInputRef}
                    value={phone}
                    placeholder={t.phonePlaceholder}
                    inputType="phone"
                    error={error}
                    maxLength={10}
                    className="h-full !px-4 shadow-sm"
                    inputClassName="body-large !font-normal text-[var(--color-text-gray-normal)] pl-2 ml-1 border-l border-[var(--color-border-gray-subtle)]"
                    onChange={(e) => validatePhone(e.target.value)}
                    inputPrefix="+91"
                    showError={false}
                  />
                </div>

                <p
                  className={`text-sm min-h-[1.25rem] ${error ? "text-red-600" : success ? "text-green-600" : "invisible"}`}
                >
                  {error || success}
                </p>

                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon />
                  <Text as="span" variant="body-small" color="gray-muted">
                    {t.otpHint}
                  </Text>
                </div>
              </div>

              <Button
                size="lg"
                sx={{ borderRadius: "50px" }}
                fullWidth
                onClick={() => handleLogin()}
                disabled={!isValidPhone || loading}
                loading={loading}
                rightIcon={<ArrowRightIcon />}
              >
                {t.continueBtn}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Text as="h1" variant="heading-large" weight="bold">
                  {t.verifyHeading}
                </Text>
                <Text as="p" variant="body-medium" color="gray-muted">
                  {t.otpSentTo} <strong>+91 {phone}</strong>{" "}
                  <span
                    onClick={handleEditNumber}
                    className="text-[var(--color-brand)] font-semibold cursor-pointer"
                  >
                    {t.editLabel}
                  </span>
                </Text>
              </div>

              <div className="space-y-2">
                <Text as="p" variant="body-small" weight="semibold" color="gray-muted">
                  {t.otpLabel}
                </Text>
                <OtpBoxInput
                  length={OTP_LENGTH}
                  value={otp}
                  error={!!error}
                  disabled={loading}
                  autoFocus
                  onChange={(val) => {
                    setOtp(val);
                    if (val.length === OTP_LENGTH) handleVerify(val);
                  }}
                />
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

                <div className="text-sm">
                  {resendingOtp ? (
                    <span className="text-[var(--color-brand)]">{t.resendingOtp}</span>
                  ) : (
                    <span
                      onClick={handleResendOtp}
                      className={`text-[var(--color-brand)] font-semibold ${resendTimer > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {resendTimer > 0
                        ? t.resendOtpTimer.replace("{seconds}", String(resendTimer))
                        : t.resendOtp}
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                sx={{ borderRadius: "50px" }}
                fullWidth
                disabled={otp.length !== OTP_LENGTH || loading}
                loading={loading}
                onClick={() => handleVerify()}
              >
                {t.verifyOtpBtn}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-brand)]/15 bg-[var(--color-brand)]/8 px-4 py-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-brand)]/12 flex items-center justify-center">
              <ShieldCheckIcon />
            </div>
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="primary-normal">
                {t.trialTitle}
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.trialSubtitle}
              </Text>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 pt-4 border-t border-[var(--color-border-gray-subtle)]">
            <Text as="p" variant="body-small" color="gray-muted" className="text-center">
              {t.terms}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted" className="text-center">
              <Link href="/terms-and-conditions" className="underline">
                Terms &amp; Conditions
              </Link>
              {" · "}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
