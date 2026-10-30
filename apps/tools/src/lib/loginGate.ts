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
  /** Extra properties added to the shared auth events (Verification Sent /
   * Resent / Failed, Authentication Outcome) while this gate is open, next to
   * `context` — e.g. which tool / download option opened the login. */
  eventProps?: Record<string, string | boolean>;
}

export type LoginGatePreset = "download-pdf";

// "Download Image & Get Free PDF" (phase 71): the visitor verifies a number, the
// image downloads, and a practice-questions PDF follows on WhatsApp. A plain
// "Download Image" never opens this gate.
const PRESETS: Record<LoginGatePreset, Record<Locale, Omit<LoginGateConfig, "id">>> = {
  "download-pdf": {
    en: {
      title: "Verify your number to get your free PDF",
      subtitle: "Verify your mobile number with OTP. We'll download your image and send a free practice questions PDF on WhatsApp.",
      submitLabel: "Continue",
      illustration: "image-lock",
      featureChips: [
        { icon: "gift", label: "100% Free Download" },
        { icon: "lock", label: "Secure & Private" },
      ],
      otpSubmitLabel: "Verify & Download",
    },
    hi: {
      title: "फ्री PDF पाने के लिए अपना नंबर वेरिफ़ाई करें",
      subtitle: "OTP से अपना मोबाइल नंबर वेरिफ़ाई करें। हम आपकी इमेज डाउनलोड करेंगे और WhatsApp पर प्रैक्टिस प्रश्नों की मुफ़्त PDF भेजेंगे।",
      submitLabel: "आगे बढ़ें",
      illustration: "image-lock",
      featureChips: [
        { icon: "gift", label: "100% मुफ़्त डाउनलोड" },
        { icon: "lock", label: "सुरक्षित और निजी" },
      ],
      otpSubmitLabel: "वेरिफ़ाई करें और डाउनलोड करें",
    },
    mr: {
      title: "मोफत PDF मिळवण्यासाठी तुमचा नंबर व्हेरिफाय करा",
      subtitle: "OTP ने तुमचा मोबाइल नंबर व्हेरिफाय करा. आम्ही तुमची इमेज डाउनलोड करू आणि WhatsApp वर सराव प्रश्नांची मोफत PDF पाठवू.",
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
