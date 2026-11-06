import type { Lang, Outcome, TestType } from "./types";

type T = Record<Lang, string>;

export const TYPE_LABEL: Record<TestType, T> = {
  topic: { en: "Topic test", hi: "टॉपिक टेस्ट" },
  daily: { en: "Daily test", hi: "डेली टेस्ट" },
  full: { en: "Full mock test", hi: "फुल मॉक टेस्ट" },
};

export const COPY = {
  questions: { en: "questions", hi: "प्रश्न" },
  minutes: { en: "min", hi: "मिनट" },
  marks: { en: "marks", hi: "अंक" },
  skip: { en: "Skip", hi: "स्किप" },
  go: { en: "Go!", hi: "शुरू!" },
  startsIn: { en: "Your test is starting", hi: "आपका टेस्ट शुरू हो रहा है" },
  dayStreak: { en: "day streak", hi: "दिन की स्ट्रीक" },
  checking: { en: "Checking your answers", hi: "आपके जवाब जाँचे जा रहे हैं" },
  allDone: { en: "All checked!", hi: "जाँच पूरी!" },
  stamp: { en: "CHECKED", hi: "जाँचा गया" },
  correct: { en: "Correct", hi: "सही" },
  wrong: { en: "Wrong", hi: "गलत" },
  skipped: { en: "Skipped", hi: "छोड़े" },
  time: { en: "Time", hi: "समय" },
  accuracy: { en: "Accuracy", hi: "सटीकता" },
  cutoff: { en: "Cutoff", hi: "कटऑफ" },
  sections: { en: "Section-wise marks", hi: "सेक्शन-वाइज़ अंक" },
  rank: { en: "Rank", hi: "रैंक" },
  of: { en: "of", hi: "में से" },
  review: { en: "Review answers", hi: "जवाब देखें" },
  retry: { en: "Retry test", hi: "दोबारा दें" },
  nextTopic: { en: "Next topic", hi: "अगला टॉपिक" },
  dashboard: { en: "Back to dashboard", hi: "डैशबोर्ड पर जाएँ" },
  mastery: { en: "Chapter mastery", hi: "चैप्टर मास्टरी" },
  levels: {
    en: ["New", "Learning", "Strong", "Mastered"],
    hi: ["नया", "सीख रहे", "मज़बूत", "मास्टर"],
  },
  week: { en: ["M", "T", "W", "T", "F", "S", "S"], hi: ["सो", "मं", "बु", "गु", "शु", "श", "र"] },
} satisfies Record<string, T | Record<Lang, string[]>>;

export const SUBMIT_NOTE: Record<TestType, T> = {
  topic: { en: "Topic test submitted", hi: "टॉपिक टेस्ट सबमिट हो गया" },
  daily: { en: "Daily test submitted · streak saved", hi: "डेली टेस्ट सबमिट · स्ट्रीक सेव" },
  full: { en: "Full mock submitted", hi: "फुल मॉक सबमिट हो गया" },
};

export const marksAway = (gap: number, lang: Lang) =>
  lang === "hi" ? `${gap} अंक` : `${gap} ${gap === 1 ? "mark" : "marks"}`;

/** Weekday initials for the last 7 days, ending today (COPY.week is Monday-first). */
export function lastSevenDays(lang: Lang, today = new Date()) {
  const week = COPY.week[lang];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return week[(d.getDay() + 6) % 7];
  });
}

/** Headline + line under the score. {gap} = "6 marks", {weak} = weakest section/topic. */
export const OUTCOME_COPY: Record<Outcome, { title: T; sub: T }> = {
  pass: {
    title: { en: "Cutoff cleared!", hi: "कटऑफ क्लियर!" },
    sub: {
      en: "You're above the cutoff. Keep this pace and review the few you missed.",
      hi: "आप कटऑफ से ऊपर हैं। यही रफ़्तार रखें और गलत सवाल दोबारा देखें।",
    },
  },
  near: {
    title: { en: "Just {gap} away", hi: "बस {gap} दूर" },
    sub: {
      en: "You're close. Fixing your mistakes in {weak} can take you over the cutoff.",
      hi: "आप बहुत करीब हैं। {weak} की गलतियाँ सुधारें, कटऑफ पार हो जाएगा।",
    },
  },
  below: {
    title: { en: "Every attempt builds your score", hi: "हर प्रयास से स्कोर बढ़ता है" },
    sub: {
      en: "Start with {weak}. That's where your next marks are.",
      hi: "{weak} से शुरुआत करें। अगले अंक वहीं मिलेंगे।",
    },
  },
};

/** Same tiers for tests that have no cutoff (the exam-series tests): no "cutoff" wording anywhere. */
export const NEUTRAL_OUTCOME_COPY: Record<Outcome, { title: T; sub: T }> = {
  pass: {
    title: { en: "Great score!", hi: "शानदार स्कोर!" },
    sub: {
      en: "You're on the right track. Keep this pace and review the few you missed.",
      hi: "आप सही राह पर हैं। यही रफ़्तार रखें और गलत सवाल दोबारा देखें।",
    },
  },
  near: {
    title: { en: "Good effort!", hi: "अच्छा प्रयास!" },
    sub: {
      en: "You're close to a great score. Fixing your mistakes in {weak} will lift it.",
      hi: "आप शानदार स्कोर के करीब हैं। {weak} की गलतियाँ सुधारने से स्कोर बढ़ेगा।",
    },
  },
  below: OUTCOME_COPY.below,
};

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
