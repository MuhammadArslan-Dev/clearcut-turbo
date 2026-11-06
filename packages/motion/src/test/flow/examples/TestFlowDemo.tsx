"use client";
// Demo harness for the test flow. Also shows the intended wiring:
// TestIntro.onStart → start timer · submit → <TestSubmit done={apiResolved}> → onFinish → <TestResult>.
import { useEffect, useState } from "react";
import { TestIntro, TestSubmit, TestResult, type ResultData, type TestType } from "..";
import type { Lang, Outcome } from "../types";

type Screen = "start" | "submit" | "result" | "flow";

const TITLES: Record<TestType, Record<Lang, string>> = {
  topic: { en: "Child Development & Pedagogy", hi: "बाल विकास एवं शिक्षाशास्त्र" },
  daily: { en: "Daily test · 5 Nov", hi: "डेली टेस्ट · 5 नवंबर" },
  full: { en: "HTET Level 2 · Full Mock 3", hi: "HTET लेवल 2 · फुल मॉक 3" },
};

const META: Record<TestType, { questions: number; minutes: number; marks: number }> = {
  topic: { questions: 20, minutes: 20, marks: 20 },
  daily: { questions: 10, minutes: 10, marks: 10 },
  full: { questions: 150, minutes: 150, marks: 150 },
};

const RULES: Record<Lang, string[]> = {
  en: ["150-minute timer starts on Go", "1 mark per question, no negative marking", "Switch Hindi / English anytime"],
  hi: ["150 मिनट का टाइमर 'शुरू' पर चलेगा", "हर प्रश्न 1 अंक, कोई नेगेटिव मार्किंग नहीं", "कभी भी हिंदी / अंग्रेज़ी बदलें"],
};

const SEC_NAMES: Record<Lang, string[]> = {
  en: ["Child Development & Pedagogy", "Hindi", "English", "Mathematics", "Environmental Studies"],
  hi: ["बाल विकास एवं शिक्षाशास्त्र", "हिंदी", "अंग्रेज़ी", "गणित", "पर्यावरण अध्ययन"],
};

/** Example data only — not real student results. */
function sample(type: TestType, outcome: Outcome, lang: Lang): ResultData {
  if (type === "topic") {
    const s = { pass: [17, 2, 1], near: [11, 6, 3], below: [7, 9, 4] }[outcome];
    return {
      score: s[0], maxScore: 20, cutoff: 12, correct: s[0], wrong: s[1], skipped: s[2], timeTakenSec: 860,
      mastery: { topic: TITLES.topic[lang], from: 1, to: outcome === "pass" ? 2 : 1 },
    };
  }
  if (type === "daily") {
    const s = { pass: [9, 1, 0], near: [5, 4, 1], below: [3, 5, 2] }[outcome];
    return {
      score: s[0], maxScore: 10, cutoff: 6, correct: s[0], wrong: s[1], skipped: s[2], timeTakenSec: 412,
      streak: { days: 12, week: [true, true, false, true, true, true, true] },
    };
  }
  const split = {
    pass: { score: 104, w: 31, sk: 15, sec: [24, 23, 19, 18, 20], rank: 128 },
    near: { score: 84, w: 44, sk: 22, sec: [21, 20, 15, 12, 16], rank: 611 },
    below: { score: 61, w: 58, sk: 31, sec: [16, 15, 11, 7, 12], rank: 1204 },
  }[outcome];
  return {
    score: split.score, maxScore: 150, cutoff: 90, correct: split.score, wrong: split.w, skipped: split.sk,
    timeTakenSec: 7960,
    sections: SEC_NAMES[lang].map((name, i) => ({ name, score: split.sec[i], max: 30 })),
    rank: { rank: split.rank, of: 2340 },
  };
}

export function TestFlowDemo({ type, screen, outcome, lang, run }: { type: TestType; screen: Screen; outcome: Outcome; lang: Lang; run: number }) {
  const [step, setStep] = useState<"start" | "submit" | "result">(screen === "flow" ? "start" : screen);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setStep(screen === "flow" ? "start" : screen);
    setDone(false);
  }, [screen, type, outcome, lang, run]);

  // fake "evaluate" API: resolves 1.5s after submit starts
  useEffect(() => {
    if (step !== "submit") return;
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, [step, run]);

  const key = `${type}-${outcome}-${lang}-${run}-${step}`;
  return (
    <>
      <MockTestPage type={type} lang={lang} />
      {step === "start" && (
        <TestIntro
          key={key}
          type={type}
          title={TITLES[type][lang]}
          {...META[type]}
          streakDays={11}
          rules={type === "full" ? RULES[lang] : undefined}
          lang={lang}
          onStart={() => (screen === "flow" ? setStep("submit") : undefined)}
        />
      )}
      {step === "submit" && (
        <TestSubmit
          key={key}
          type={type}
          total={META[type].questions}
          done={done}
          lang={lang}
          onFinish={() => (screen === "flow" ? setStep("result") : undefined)}
        />
      )}
      {step === "result" && (
        <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: "#fff", padding: "20px 16px" }}>
          <TestResult key={key} type={type} data={sample(type, outcome, lang)} lang={lang} />
        </div>
      )}
    </>
  );
}

function MockTestPage({ type, lang }: { type: TestType; lang: Lang }) {
  return (
    <div style={{ padding: 20, color: "#192839" }}>
      <div style={{ fontWeight: 700, color: "#2b7eff" }}>
        Clear <span style={{ color: "#40566d" }}>Cutoff</span>
      </div>
      <h3 style={{ margin: "18px 0 6px", fontSize: 18 }}>{TITLES[type][lang]}</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#566c82" }}>Q1 of {META[type].questions}</p>
    </div>
  );
}
