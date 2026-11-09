"use client";

/**
 * Motion-preview tabs "Onboarding" / "Enrollment": the app's real screens + the library's animation, embedded as an
 * <iframe> (`/animation-preview/demo/{flow}`) so phone and desktop breakpoints are the real ones. Dev/QA only.
 */
import { useState } from "react";

type Flow = "onboarding" | "enrollment";
type Device = "phone" | "desktop";
type Lang = "en" | "hi" | "mr";

function Seg<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="group">
      <span id={`${id}-l`}>{label}</span>
      <div className="seg" role="group" aria-labelledby={`${id}-l`}>
        {options.map(([v, t]) => (
          <button key={v} id={`${id}-${v}`} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FlowFrame({ flow }: { flow: Flow }) {
  const [device, setDevice] = useState<Device>("phone");
  const [lang, setLang] = useState<Lang>("en");
  const [speed, setSpeed] = useState<"fast" | "slow">("fast");
  const [run, setRun] = useState(0);

  const prefix = lang === "en" ? "" : `/${lang}`;
  const src = `${prefix}/animation-preview/demo/${flow}?speed=${speed}`;
  const phone = device === "phone";

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="controls" style={{ display: "flex", flexWrap: "wrap", gap: "14px 28px", alignItems: "flex-end" }}>
        <Seg id={`${flow}-d`} label="Device" value={device} onChange={(v) => { setDevice(v); setRun((r) => r + 1); }} options={[["phone", "Phone"], ["desktop", "Desktop"]]} />
        <Seg id={`${flow}-l`} label="App language" value={lang} onChange={(v) => { setLang(v); setRun((r) => r + 1); }} options={[["en", "English"], ["hi", "हिंदी"], ["mr", "मराठी"]]} />
        <Seg id={`${flow}-s`} label="Data" value={speed} onChange={(v) => { setSpeed(v); setRun((r) => r + 1); }} options={[["fast", "Loads fast"], ["slow", "Slow network"]]} />
        <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>Start over</button>
      </div>
      <p className="note" style={{ maxWidth: "none" }}>
        {flow === "onboarding"
          ? "Use the screens like a student: pick a language, Continue, pick an exam, Continue. Sample exams only; the real flow loads them from the backend. Marathi plays the animation's Hindi copy."
          : "Use the sheet like a student: pick a paper, Continue to Subjects, pick one option in each group, Start Learning. Sample papers and subjects only. Marathi plays the animation's Hindi copy."}
      </p>
      <div
        style={{
          justifySelf: "center",
          width: phone ? 390 : "100%",
          maxWidth: "100%",
          height: phone ? 780 : 680,
          overflow: "hidden",
          border: phone ? "8px solid #192839" : "1px solid #dde6ef",
          borderRadius: phone ? 34 : 12,
          background: "#fff",
          boxShadow: "0 18px 40px -24px rgb(25 40 57 / 0.5)",
        }}
      >
        <iframe key={`${run}-${src}`} src={src} title={`${flow} preview`} style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
      </div>
    </div>
  );
}
