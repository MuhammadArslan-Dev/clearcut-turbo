export type SoundKey =
  | "payment_success"
  | "payment_failure"
  | "warning"
  | "click";

export const SOUND_FILES: Record<SoundKey, string> = {
  payment_success: "/sounds/successedTest.mp3",
  payment_failure: "/sounds/successedTest.mp3",
  warning: "/sounds/error-test.mp3",
  click: "/sounds/successedTest.mp3",
};
