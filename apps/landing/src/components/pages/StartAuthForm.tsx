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
import { useTruecallerLogin } from "@clearcut/auth/truecaller";
import { identifyClarityUser } from "@clearcut/analytics/clarity";

const OTP_LENGTH = 4;
const RESEND_INTERVAL = 30;
// Persists the pending (unverified) signup's user_id across a page refresh
// mid-flow. Without this, refreshing between "phone submitted" and "OTP
// verified" loses it from this component's local state, so the next submit
// omits user_id and AuthController::login creates a duplicate pending user
// row instead of updating the existing one. Read directly (not via
// useAuthStore's persisted pattern) because this value is never rendered —
// it only feeds API payloads/analytics, so there's no hydration-mismatch
// risk to guard against here.
const PENDING_USER_ID_KEY = "pending_user_id";
const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in";
// "Login with WhatsApp" — pure frontend wa.me deep link, no backend call.
// Opens a chat to our own number with a fixed pre-filled message; the user
// taps send themselves. Everything past that (identifying the sender,
// creating/looking up their account, replying with a login link) is handled
// by an n8n automation watching this WhatsApp number, not by this app.
const WHATSAPP_NUMBER = "917404758398";
const WHATSAPP_DEFAULT_MESSAGE = "Hi, I want to login to Clear Cutoff";

const CONTENT: Record<
  Locale,
  {
    heading: string;
    featuresLine: string;
    otpHint: string;
    terms: string;
    andWord: string;
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
    truecallerBtn: string;
    truecallerWaiting: string;
    truecallerUnavailable: string;
    whatsappBtn: string;
    orDivider: string;
  }
> = {
  en: {
    heading: "Start your exam preparation",
    featuresLine: "Videos • Notes • PYQs",
    otpHint: "We will send you an OTP to verify your number",
    terms: "By continuing, you agree to our",
    andWord: "and",
    mobileLabel: "Mobile or WhatsApp Number",
    phonePlaceholder: "10-digit number",
    continueBtn: "Start FREE Preparation",
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
    truecallerBtn: "Truecaller",
    truecallerWaiting: "Waiting…",
    truecallerUnavailable: "Truecaller app not found — continue below",
    whatsappBtn: "WhatsApp",
    orDivider: "OR",
  },
  hi: {
    heading: "अपनी परीक्षा की तैयारी शुरू करें",
    featuresLine: "वीडियो • नोट्स • PYQs",
    otpHint: "आपके नंबर को वेरीफाई करने के लिए हम एक OTP भेजेंगे",
    terms: "जारी रखकर, आप हमारी",
    andWord: "और",
    mobileLabel: "मोबाइल या व्हाट्सएप नंबर",
    phonePlaceholder: "10-अंकों का नंबर",
    continueBtn: "मुफ़्त तैयारी शुरू करें",
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
    truecallerBtn: "Truecaller",
    truecallerWaiting: "प्रतीक्षा करें…",
    truecallerUnavailable: "Truecaller ऐप नहीं मिला — नीचे जारी रखें",
    whatsappBtn: "WhatsApp",
    orDivider: "या",
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

// Generic placeholder mark — swap for Truecaller's actual brand icon
// (subject to their brand guidelines) once real credentials are in.
function TruecallerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
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

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M11.5143 2.01158C6.2043 2.26158 2.0153 6.65158 2.0313 11.9286C2.03393 13.4819 2.40582 15.0123 3.1163 16.3936L2.0583 21.4946C2.04539 21.5584 2.04877 21.6244 2.06812 21.6865C2.08748 21.7486 2.12219 21.8048 2.16904 21.85C2.21589 21.8952 2.27337 21.9278 2.33616 21.9448C2.39896 21.9619 2.46504 21.9628 2.5283 21.9476L7.5623 20.7636C8.89558 21.4224 10.3592 21.775 11.8463 21.7956C17.2733 21.8786 21.7973 17.6006 21.9663 12.2156C22.1483 6.44058 17.3493 1.73458 11.5143 2.01058V2.01158ZM17.5213 17.3786C16.7958 18.1015 15.9347 18.6741 14.9875 19.0637C14.0403 19.4532 13.0255 19.652 12.0013 19.6486C10.7963 19.6523 9.60698 19.3756 8.5273 18.8406L7.8263 18.4936L4.7393 19.2196L5.3893 16.0886L5.0433 15.4166C4.4824 14.3293 4.19153 13.123 4.1953 11.8996C4.1953 9.82958 5.0073 7.88258 6.4813 6.41958C7.95049 4.96528 9.93405 4.14922 12.0013 4.14858C14.0873 4.14858 16.0473 4.95458 17.5213 6.41858C18.2475 7.13421 18.8238 7.98742 19.2165 8.92834C19.6092 9.86926 19.8103 10.879 19.8083 11.8986C19.8083 13.9506 18.9833 15.9286 17.5213 17.3796V17.3786Z"
        fill="#25D366"
      />
      <path
        d="M16.8424 14.045L14.9114 13.495C14.7868 13.4592 14.6548 13.4576 14.5294 13.4903C14.404 13.5231 14.2896 13.5889 14.1984 13.681L13.7264 14.159C13.6287 14.2579 13.5041 14.3259 13.368 14.3543C13.2319 14.3828 13.0905 14.3705 12.9614 14.319C12.0484 13.952 10.1264 12.256 9.63538 11.407C9.56655 11.2871 9.53511 11.1493 9.54509 11.0114C9.55507 10.8735 9.60601 10.7418 9.69138 10.633L10.1034 10.103C10.1827 10.0015 10.2329 9.88023 10.2486 9.75234C10.2642 9.62445 10.2448 9.4947 10.1924 9.377L9.38038 7.553C9.33446 7.45105 9.26551 7.36114 9.17896 7.29034C9.09242 7.21954 8.99063 7.16979 8.8816 7.14498C8.77257 7.12017 8.65928 7.12098 8.55062 7.14736C8.44196 7.17374 8.3409 7.22496 8.25538 7.297C7.71638 7.75 7.07638 8.437 6.99938 9.2C6.86238 10.543 7.44238 12.236 9.63638 14.27C12.1714 16.619 14.2024 16.93 15.5234 16.611C16.2734 16.431 16.8734 15.708 17.2504 15.117C17.3107 15.0231 17.3481 14.9164 17.3596 14.8054C17.3712 14.6945 17.3565 14.5823 17.3168 14.4781C17.2771 14.3738 17.2135 14.2803 17.1311 14.2051C17.0487 14.1299 16.9498 14.075 16.8424 14.045Z"
        fill="#25D366"
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

/**
 * Interactive left panel — the only client-rendered part of /start.
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

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem(PENDING_USER_ID_KEY) ?? "")
      : "",
  );
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
      // Sends back the previous attempt's user_id, when there is one, so the
      // backend can correct that pending (unverified) row's phone instead of
      // leaving it behind as an orphan account and inserting a new one.
      const res = await authApi.loginUser({
        phone: number,
        user_id: userId || undefined,
      });
      const { data, message } = res?.data;

      logAmplitudeEvent("Verification Sent", {
        phone: number,
        verification_method: "Number",
        verification_mode: "SMS",
        verification_purpose: "Login",
      });

      localStorage.setItem("is_new_user", data?.is_new_user ? "true" : "false");
      setIsNewUser(Boolean(data?.is_new_user));

      // The backend only echoes `user_id` back for a genuinely new signup
      // (AuthController::login) — an update to an already-known pending row
      // returns none. Fall back to the id we already have instead of
      // blanking it out, so a 2nd+ correction on the same pending row still
      // carries it forward.
      const nextUserId = data?.user_id ?? userId;
      setUserId(nextUserId);
      if (nextUserId) {
        localStorage.setItem(PENDING_USER_ID_KEY, nextUserId);
      }

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
      await authApi.loginUser({ phone, user_id: userId || undefined });
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

  const handleWhatsAppLogin = () => {
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
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
      // Verified now — no longer a "pending" row a future refresh should
      // try to reuse/update.
      localStorage.removeItem(PENDING_USER_ID_KEY);
      trackFacebookLead(isNewUser, phone, userId);
      identifyClarityUser({ userId, phone });

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
      baseUrl: REDIRECT_BASE_URL,
      token: result.token,
      hasCourse: result.hasCourse,
      userType: "old",
      lang,
      course,
    });

    window.location.replace(redirectUrl);
  });

  const truecallerBusy = truecallerState === "opening" || truecallerState === "waiting";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 md:px-10 lg:px-12">
      <div className="flex justify-center pt-10">
        <Link href="/">
          <Image src={IMAGES.mainLogo} alt="Clear Cutoff" width={250} height={57} priority />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-[380px] flex flex-col gap-5">
          {step === "phone" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1 text-center">
                <Text as="h1" variant="heading-large" weight="bold">
                  {t.heading}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.featuresLine}
                </Text>
              </div>

              {/* Truecaller only works via its app deep-link — desktop has
                  no app to hand off to, so this row (and its OR divider)
                  only render below the md breakpoint. WhatsApp's wa.me link
                  works on desktop too, but stays paired here rather than
                  getting its own separate desktop layout. */}
              <div className="flex md:hidden flex-col gap-2">
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
                    {truecallerState === "waiting" ? t.truecallerWaiting : t.truecallerBtn}
                  </Button>

                  {/* "Login with WhatsApp" — logic is fully wired
                      (handleWhatsAppLogin, the wa.me deep link), just not
                      shown yet. Uncomment to go live. */}
                  <Button
                    size="sm"
                    variant="outlined"
                    sx={{ borderRadius: "50px" }}
                    className="!bg-[#25D366]/5 hover:!bg-[#25D366]/10 !border-[#25D366]/30 shadow-sm"
                    fullWidth
                    onClick={handleWhatsAppLogin}
                    leftIcon={<WhatsAppIcon />}
                  >
                    {t.whatsappBtn}
                  </Button>
                </div>

                {truecallerState === "unavailable" && (
                  <p className="text-sm text-center text-[var(--color-text-gray-muted)]">
                    {t.truecallerUnavailable}
                  </p>
                )}
                {truecallerState === "error" && truecallerError && (
                  <p className="text-sm text-center text-red-600">{truecallerError}</p>
                )}

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                  <Text as="span" variant="body-small" color="gray-muted">
                    {t.orDivider}
                  </Text>
                  <div className="flex-1 h-px bg-[var(--color-border-gray-subtle)]" />
                </div>
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

          <div className="pt-4 border-t border-[var(--color-border-gray-subtle)]">
            <Text as="p" variant="body-small" color="gray-muted" className="text-center">
              {t.terms}{" "}
              <Link href="/terms-and-conditions" className="text-[var(--color-brand)] font-medium">
                Terms &amp; Conditions
              </Link>{" "}
              {t.andWord}{" "}
              <Link href="/privacy-policy" className="text-[var(--color-brand)] font-medium">
                Privacy Policy
              </Link>
              .
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
