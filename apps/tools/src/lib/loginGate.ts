import type { Locale } from "./dictionary";

// One place that describes WHY a Tools page is asking a visitor to log in.
// The OTP flow itself (send, verify, resend cooldown, rate limits, session) is
// the shared @clearcut/auth feature (see toolsAuthFeature.ts) — a gate config
// only supplies the words the modal shows and an id that is attached to the
// auth analytics events as `context`. The look (illustration, field, buttons,
// OTP step) is the shared approved login design (phase 69); a config only
// picks the illustration and the contextual copy.
export interface LoginGateConfig {
  /** Stable id, sent as the `context` property on the auth events. */
  id: string;
  title: string;
  subtitle: string;
  /** The modal's primary button (the "send OTP" step). */
  submitLabel: string;
  /** Picture above the title (default in the package: "study"). */
  illustration?: "study" | "image-lock" | null;
  /** Icon chips shown instead of the trial line. */
  featureChips?: { icon: "gift" | "lock"; label: string }[];
  /** Primary button of the OTP step. */
  otpSubmitLabel?: string;
}

export type LoginGatePreset = "download";

const PRESETS: Record<LoginGatePreset, Record<Locale, Omit<LoginGateConfig, "id">>> = {
  download: {
    en: {
      title: "Verify your number to download",
      subtitle: "Verify your mobile number with OTP to download your resized image for free.",
      submitLabel: "Continue",
      illustration: "image-lock",
      featureChips: [
        { icon: "gift", label: "100% Free Download" },
        { icon: "lock", label: "Secure & Private" },
      ],
      otpSubmitLabel: "Verify & Download",
    },
    hi: {
      title: "डाउनलोड के लिए अपना नंबर वेरिफ़ाई करें",
      subtitle: "अपनी रिसाइज़ की हुई इमेज मुफ़्त डाउनलोड करने के लिए OTP से अपना मोबाइल नंबर वेरिफ़ाई करें।",
      submitLabel: "आगे बढ़ें",
      illustration: "image-lock",
      featureChips: [
        { icon: "gift", label: "100% मुफ़्त डाउनलोड" },
        { icon: "lock", label: "सुरक्षित और निजी" },
      ],
      otpSubmitLabel: "वेरिफ़ाई करें और डाउनलोड करें",
    },
    mr: {
      title: "डाउनलोडसाठी तुमचा नंबर व्हेरिफाय करा",
      subtitle: "तुमची रिसाइझ केलेली इमेज मोफत डाउनलोड करण्यासाठी OTP ने तुमचा मोबाइल नंबर व्हेरिफाय करा.",
      submitLabel: "पुढे जा",
      illustration: "image-lock",
      featureChips: [
        { icon: "gift", label: "100% मोफत डाउनलोड" },
        { icon: "lock", label: "सुरक्षित आणि खाजगी" },
      ],
      otpSubmitLabel: "व्हेरिफाय करा आणि डाउनलोड करा",
    },
  },
};

export function getLoginGateConfig(preset: LoginGatePreset, locale: Locale): LoginGateConfig {
  return { id: preset, ...PRESETS[preset][locale] };
}
