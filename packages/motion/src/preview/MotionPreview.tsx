"use client";
// ClearCutoff Motion Library — preview gallery built from the real components (port of gallery/entry.tsx).

import { useEffect, useState, type ReactNode } from "react";
import "./preview.css";
import { CCLoader, type LoaderDesign } from "../loader";
import { TestFlowDemo } from "../test/flow/examples/TestFlowDemo";
import { NibMascot, type NibAccessory, type NibMood } from "../nibbu";
import type { Outcome, TestType } from "../test/flow/types";
import { OnboardingPanel, EnrollPanel, MiniTestPanel, PdfPanel } from "./screens";

export type Tab = "loaders" | "onboarding" | "enrollment" | "mini-test" | "pdf" | "test-flow" | "nibbu";
type Lang = "en" | "hi";
const TABS: [Tab, string][] = [
  ["loaders", "Loaders"],
  ["onboarding", "Onboarding"],
  ["enrollment", "Enrollment"],
  ["mini-test", "Mini test"],
  ["pdf", "PDF download"],
  ["test-flow", "Test results"],
  ["nibbu", "Nibbu"],
];

function useHashTab(): [Tab, (t: Tab) => void] {
  const read = (): Tab => {
    const h = location.hash.replace("#", "");
    return (TABS.find(([t]) => t === h)?.[0] ?? "loaders") as Tab;
  };
  const [tab, setTab] = useState<Tab>("loaders"); // hash is read after mount (SSR-safe)
  useEffect(() => {
    setTab(read());
    const on = () => setTab(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return [tab, (t) => { location.hash = t; setTab(t); }];
}

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

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone" aria-label="Phone preview">
      <div className="mock">
        <div className="mockLogo">Clear <span>Cutoff</span></div>
        <h3>HTET Level 2 · Full Mock 3</h3>
        <p>150 questions · 150 minutes</p>
        <div className="mockCard" />
        <div className="mockCard" />
      </div>
      {children}
    </div>
  );
}

/* ---------------- Loaders ---------------- */

const DESIGNS: [LoaderDesign, string, string][] = [
  ["omr", "V1 · OMR Hop", "Hops across answer bubbles and marks the right one"],
  ["cutoff", "V2 · Cutoff Climb", "Runs up a score bar and clears the cutoff line"],
  ["notebook", "V3 · Notebook", "Writes notes on ruled paper, then ticks them"],
  ["flashcard", "V4 · Flashcard", "A PYQ card flips from ? to Correct!"],
  ["path", "V5 · Lesson Path", "New · Hops up a chapter path to the trophy"],
  ["book", "V6 · Book Flip", "New · Pages turn and fresh notes write in"],
  ["stopwatch", "V7 · Stopwatch", "New · Bounces to the beat, dings at full time"],
];

function LoadersPanel() {
  const [view, setView] = useState<"compare" | "single">("compare");
  const [design, setDesign] = useState<LoaderDesign>("omr");
  const [variant, setVariant] = useState<"fullscreen" | "inline" | "compact">("fullscreen");
  const [lang, setLang] = useState<Lang>("en");
  const [active, setActive] = useState(true);
  const [run, setRun] = useState(0);
  const restart = () => { setActive(true); setRun((r) => r + 1); };

  return (
    <section className="panel" aria-label="Loaders">
      <div className="panelHead">
        <div>
          <h2>Loaders</h2>
          <p>Seven designs, one component: <code>&lt;CCLoader design="…" /&gt;</code>. V5–V7 are new. Compare them side by side or open one in context.</p>
        </div>
        <Seg id="lv" label="View" value={view} onChange={(v) => { setView(v); restart(); }} options={[["compare", "Compare all"], ["single", "In context"]]} />
      </div>

      {view === "compare" ? (
        <>
          <div className="compareBar">
            <Seg id="lc" label="Copy" value={lang} onChange={(v) => { setLang(v); restart(); }} options={[["en", "English"], ["hi", "हिंदी"]]} />
          </div>
          <div className="compare">
            {DESIGNS.map(([d, name, desc]) => (
              <figure key={d} className="loaderCard">
                <figcaption>
                  <b>{name}</b>
                  <span>{desc}</span>
                </figcaption>
                <div className="loaderHost">
                  <CCLoader key={`${d}-${lang}-${run}`} variant="inline" design={d} lang={lang} tips={false} delay={0} />
                </div>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="designs" role="group" aria-label="Design">
            {DESIGNS.map(([d, name, desc]) => (
              <button key={d} id={`d-${d}`} className="design" aria-pressed={design === d} onClick={() => { setDesign(d); restart(); }}>
                <b>{name}</b>
                <span>{desc}</span>
              </button>
            ))}
          </div>
          <div className="layout">
            <div className="controls">
              <Seg id="v" label="Variant" value={variant} onChange={(v) => { setVariant(v); restart(); }} options={[["fullscreen", "Overlay"], ["inline", "Inline"], ["compact", "Compact"]]} />
              <Seg id="l" label="Copy" value={lang} onChange={(v) => { setLang(v); restart(); }} options={[["en", "English"], ["hi", "हिंदी"]]} />
              {variant !== "compact" && (
                <button type="button" className="replay" onClick={() => (active ? setActive(false) : restart())}>
                  {active ? "Finish loading" : "Load again"}
                </button>
              )}
              <p className="note">Overlay waits 250 ms before showing and stays at least 700 ms in production. Both are set to zero here so you can see it straight away.</p>
            </div>
            <Phone>
              {variant === "fullscreen" && <CCLoader key={`${design}-${lang}-${run}`} variant="fullscreen" design={design} lang={lang} active={active} delay={0} minDuration={0} />}
              {variant === "inline" && (
                <div className="inlineHost">
                  <CCLoader key={`${design}-${lang}-${run}`} variant="inline" design={design} lang={lang} active={active} delay={0} minDuration={0} />
                </div>
              )}
              {variant === "compact" && (
                <div className="compactHost">
                  <span className="pill">
                    <CCLoader key={`c1-${lang}-${run}`} variant="compact" tone="onBrand" label={lang === "hi" ? "टेस्ट शुरू हो रहा है" : "Starting test"} />
                  </span>
                  <div className="row">
                    {lang === "hi" ? "मॉक 3 का रिज़ल्ट" : "Mock 3 results"}
                    <CCLoader key={`c2-${lang}-${run}`} variant="compact" label={lang === "hi" ? "जाँच हो रही है" : "Checking"} />
                  </div>
                </div>
              )}
            </Phone>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Test flow ---------------- */

function TestFlowPanel() {
  const [type, setType] = useState<TestType>("full");
  const [screen, setScreen] = useState<"start" | "submit" | "result" | "flow">("result");
  const [outcome, setOutcome] = useState<Outcome>("pass");
  const [lang, setLang] = useState<Lang>("en");
  const [run, setRun] = useState(0);
  const replay = () => setRun((r) => r + 1);
  return (
    <section className="panel" aria-label="Test flow">
      <div className="panelHead">
        <div>
          <h2>Test results flow</h2>
          <p>Start, submit and result screens for topic tests, daily tests and full mocks: <code>TestIntro</code>, <code>TestSubmit</code>, <code>TestResult</code>.</p>
        </div>
      </div>
      <div className="layout">
        <div className="controls">
          <Seg id="t" label="Test" value={type} onChange={(v) => { setType(v); replay(); }} options={[["topic", "Topic"], ["daily", "Daily"], ["full", "Full mock"]]} />
          <Seg id="s" label="Screen" value={screen} onChange={(v) => { setScreen(v); replay(); }} options={[["start", "Start"], ["submit", "Submit"], ["result", "Result"], ["flow", "Play all"]]} />
          <Seg id="o" label="Score" value={outcome} onChange={(v) => { setOutcome(v); replay(); }} options={[["pass", "Cleared"], ["near", "Close"], ["below", "Below"]]} />
          <Seg id="tl" label="Copy" value={lang} onChange={(v) => { setLang(v); replay(); }} options={[["en", "English"], ["hi", "हिंदी"]]} />
          <button type="button" className="replay" onClick={replay}>Replay animation</button>
          <p className="note">Scores, ranks and sections are example data.</p>
        </div>
        <div className="phone bare">
          <TestFlowDemo type={type} screen={screen} outcome={outcome} lang={lang} run={run} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Nibbu ---------------- */

const POSES: [NibMood, NibAccessory, string, string][] = [
  ["happy", "none", "Default", "Loaders, empty states"],
  ["wow", "none", "Wow", "Countdown Go!, stamp moment"],
  ["determined", "none", "Determined", "Full-mock intro"],
  ["determined", "headband", "Keep going", "Close / below cutoff"],
  ["happy", "cap", "Cleared", "Cutoff cleared"],
];

function NibbuPanel() {
  return (
    <section className="panel" aria-label="Nibbu">
      <div className="panelHead">
        <div>
          <h2>Nibbu</h2>
          <p>The approved mascot, drawn from the logo's pen nib. One SVG with moods and accessories: <code>&lt;NibMascot mood accessory /&gt;</code>.</p>
        </div>
      </div>
      <div className="poses">
        {POSES.map(([mood, acc, name, use]) => (
          <figure key={name} className="pose">
            <div className="poseArt">
              <NibMascot mood={mood} accessory={acc} />
            </div>
            <figcaption>
              <b>{name}</b>
              <span>{use}</span>
              <code>{`mood="${mood}"${acc !== "none" ? ` accessory="${acc}"` : ""}`}</code>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------- App ---------------- */

/**
 * `slots` lets the host app replace a tab's content with its own composition (e.g. the dashboard
 * shows its real mini-test UI with only the library's animations). Keys are tab ids.
 */
export function MotionPreview({ slots }: { slots?: Partial<Record<Tab, ReactNode>> }) {
  const [tab, setTab] = useHashTab();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const rate = slow ? 0.5 : 1;
    const apply = () => document.getAnimations().forEach((a) => { if (a.playbackRate !== rate) a.playbackRate = rate; });
    apply();
    const id = setInterval(apply, 80);
    return () => clearInterval(id);
  }, [slow]);

  return (
    <div className="motionPreview">
    <div className="wrap">
      <header className="top">
        <div>
          <h1>ClearCutoff Motion Library</h1>
          <p>Every loader, transition and screen animation for the ClearCutoff app, running from the production components.</p>
        </div>
        <label className="switch" htmlFor="slow">
          <input type="checkbox" id="slow" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
          <i />
          Slow motion 0.5×
        </label>
      </header>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(([t, label]) => (
          <a key={t} href={`#${t}`} aria-current={tab === t ? "page" : undefined} onClick={(e) => { e.preventDefault(); setTab(t); }}>
            {label}
          </a>
        ))}
      </nav>
      {tab === "loaders" && <LoadersPanel />}
      {tab === "onboarding" && (slots?.onboarding ? (
        <section className="panel" aria-label="Onboarding">
          <div className="panelHead">
            <div>
              <h2>Onboarding</h2>
              <p>The app's real onboarding screens (language, exam) followed by the library's completion animation, then the dashboard.</p>
            </div>
          </div>
          {slots.onboarding}
        </section>
      ) : <OnboardingPanel />)}
      {tab === "enrollment" && (slots?.enrollment ? (
        <section className="panel" aria-label="Enrollment">
          <div className="panelHead">
            <div>
              <h2>Exam enrollment</h2>
              <p>The app's real "Select Paper / Select Subjects" sheet followed by the library's enrollment animation, then the Preparation page.</p>
            </div>
          </div>
          {slots.enrollment}
        </section>
      ) : <EnrollPanel />)}
      {tab === "mini-test" && (slots?.["mini-test"] ? (
        <section className="panel" aria-label="Mini test">
          <div className="panelHead">
            <div>
              <h2>Mini test</h2>
              <p>The app's own mini-test UI with the motion library's animations only.</p>
            </div>
          </div>
          {slots["mini-test"]}
        </section>
      ) : <MiniTestPanel />)}
      {tab === "pdf" && <PdfPanel />}
      {tab === "test-flow" && <TestFlowPanel />}
      {tab === "nibbu" && <NibbuPanel />}
    </div>
    </div>
  );
}

export default MotionPreview;
