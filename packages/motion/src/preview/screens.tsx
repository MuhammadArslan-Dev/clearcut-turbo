// Gallery panels for the new screens. Each one shows the real component in a phone, with the
// surrounding app screen mocked so the transition in and out can be judged in context.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { OnboardingComplete } from "../onboarding";
import { EnrollSuccess } from "../enrollment";
import { MiniTest, type MiniTestResult } from "../test/mini-test";
import { DownloadCard, type DownloadStatus } from "../download";
import { TestResult } from "../test/flow";
import { QUESTIONS, SUBJECTS, PDFS } from "./samples";

type Lang = "en" | "hi";

export function Seg<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
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

function Panel({ title, intro, controls, children }: { title: string; intro: ReactNode; controls: ReactNode; children: ReactNode }) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panelHead">
        <div>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
      </div>
      <div className="layout">
        <div className="controls">{controls}</div>
        <div className="phone bare">{children}</div>
      </div>
    </section>
  );
}

/* --------------------------- mock app screens --------------------------- */

function Dashboard({ lang, name }: { lang: Lang; name: string }) {
  return (
    <div className="app appIn">
      <div className="appBar"><span className="mockLogo">Clear <span>Cutoff</span></span><span className="avatar">{name[0]}</span></div>
      <h3>{lang === "hi" ? `नमस्ते, ${name}` : `Hi ${name}`}</h3>
      <div className="appCard hero">
        <b>{lang === "hi" ? "आज का डेली टेस्ट" : "Today's daily test"}</b>
        <span>{lang === "hi" ? "10 प्रश्न · 10 मिनट" : "10 questions · 10 min"}</span>
      </div>
      <div className="appRow"><div className="appCard" /><div className="appCard" /></div>
      <div className="appCard tall" />
    </div>
  );
}

function SubjectPicker({ lang, picked, toggle, onEnroll }: { lang: Lang; picked: string[]; toggle: (s: string) => void; onEnroll: () => void }) {
  return (
    <div className="app">
      <div className="appBar"><span className="mockLogo">Clear <span>Cutoff</span></span></div>
      <h3>{lang === "hi" ? "HTET लेवल 2 के विषय चुनें" : "Choose your HTET Level 2 subjects"}</h3>
      <p className="appSub">{lang === "hi" ? "आप बाद में बदल सकते हैं" : "You can change these later"}</p>
      <div className="pickGrid">
        {SUBJECTS[lang].map((sub) => (
          <button key={sub} type="button" className="pick" aria-pressed={picked.includes(sub)} onClick={() => toggle(sub)}>
            <i />
            {sub}
          </button>
        ))}
      </div>
      <button type="button" className="appCta" disabled={picked.length === 0} onClick={onEnroll}>
        {lang === "hi" ? `नामांकन करें (${picked.length})` : `Enroll (${picked.length})`}
      </button>
    </div>
  );
}

function PrepPage({ lang, subjects }: { lang: Lang; subjects: string[] }) {
  return (
    <div className="app appIn">
      <div className="appBar"><span className="mockLogo">Clear <span>Cutoff</span></span></div>
      <h3>{lang === "hi" ? "आपकी तैयारी" : "Your preparation"}</h3>
      <p className="appSub">HTET Level 2 · {subjects.length} {lang === "hi" ? "विषय" : "subjects"}</p>
      {subjects.slice(0, 4).map((s, i) => (
        <div key={s} className="appCard subj" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
          <b>{s}</b>
          <span>{lang === "hi" ? "मिनी टेस्ट · 5 प्रश्न" : "Mini test · 5 questions"}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Onboarding ------------------------------ */

export function OnboardingPanel() {
  const [lang, setLang] = useState<Lang>("en");
  const [speed, setSpeed] = useState<"fast" | "slow">("fast");
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const name = lang === "hi" ? "प्रिया" : "Priya";

  useEffect(() => {
    setReady(false);
    setDone(false);
    const t = setTimeout(() => setReady(true), speed === "fast" ? 2600 : 6500);
    return () => clearTimeout(t);
  }, [run, speed, lang]);

  return (
    <Panel
      title="Onboarding complete"
      intro={<>Celebrate the finished onboarding, show honest progress while the dashboard loads, then lift away to reveal it. <code>&lt;OnboardingComplete ready onDone /&gt;</code></>}
      controls={
        <>
          <Seg id="ol" label="Copy" value={lang} onChange={(v) => { setLang(v); setRun((r) => r + 1); }} options={[["en", "English"], ["hi", "हिंदी"]]} />
          <Seg id="os" label="Dashboard data" value={speed} onChange={(v) => { setSpeed(v); setRun((r) => r + 1); }} options={[["fast", "Loads fast"], ["slow", "Slow network"]]} />
          <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>Replay</button>
          <p className="note">The last step only ticks when the data is actually ready. Try "Slow network" to see it wait.</p>
        </>
      }
    >
      <Dashboard key={`d-${run}-${done}`} lang={lang} name={name} />
      {!done && (
        <OnboardingComplete
          key={`o-${run}`}
          name={name}
          lang={lang}
          summary={lang === "hi" ? ["HTET लेवल 2", "हिंदी माध्यम", "रोज़ 20 मिनट"] : ["HTET Level 2", "Hindi medium", "20 min a day"]}
          ready={ready}
          onDone={() => setDone(true)}
        />
      )}
    </Panel>
  );
}

/* ------------------------------ Enrollment ------------------------------ */

export function EnrollPanel() {
  const [lang, setLang] = useState<Lang>("en");
  const [stage, setStage] = useState<"pick" | "enroll" | "prep">("pick");
  const [picked, setPicked] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setPicked(SUBJECTS[lang].slice(0, 4));
    setStage("pick");
  }, [lang, run]);
  useEffect(() => {
    if (stage !== "enroll") return;
    setReady(false);
    const t = setTimeout(() => setReady(true), 3200);
    return () => clearTimeout(t);
  }, [stage]);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <Panel
      title="Exam enrollment"
      intro={<>Picked subjects fly into the exam ticket, it gets stamped, the 7-day plan fills, then the ticket zooms into the preparation page. <code>&lt;EnrollSuccess exam subjects ready onDone /&gt;</code></>}
      controls={
        <>
          <Seg id="el" label="Copy" value={lang} onChange={setLang} options={[["en", "English"], ["hi", "हिंदी"]]} />
          <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>Start over</button>
          <p className="note">Select or clear subjects in the phone, then tap Enroll.</p>
        </>
      }
    >
      {stage === "pick" && <SubjectPicker lang={lang} picked={picked} toggle={toggle} onEnroll={() => setStage("enroll")} />}
      {stage !== "pick" && <PrepPage key={`p-${run}`} lang={lang} subjects={picked} />}
      {stage === "enroll" && (
        <EnrollSuccess exam={lang === "hi" ? "HTET लेवल 2" : "HTET Level 2"} subjects={picked} lang={lang} ready={ready} onDone={() => setStage("prep")} />
      )}
    </Panel>
  );
}

/* ------------------------------- Mini test ------------------------------- */

export function MiniTestPanel() {
  const [lang, setLang] = useState<Lang>("en");
  const [layout, setLayout] = useState<"focus" | "exam">("focus");
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<MiniTestResult | null>(null);
  const qs = QUESTIONS[lang];

  useEffect(() => setResult(null), [lang, layout, run]);

  return (
    <Panel
      title="Mini test"
      intro={<>Two directions for the preparation-page mini test. <b>Focus</b>: one question at a time with instant feedback and streaks. <b>Exam</b>: real-exam feel with OMR bubbles, a timer ring and a question palette. <code>&lt;MiniTest layout /&gt;</code></>}
      controls={
        <>
          <Seg id="ml" label="Layout" value={layout} onChange={setLayout} options={[["focus", "Focus (practice)"], ["exam", "Exam (timed)"]]} />
          <Seg id="mc" label="Copy" value={lang} onChange={setLang} options={[["en", "English"], ["hi", "हिंदी"]]} />
          <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>Restart test</button>
          <p className="note">
            {layout === "focus"
              ? "Pick an answer, then Check. Get 3 right in a row for a streak toast. Keys 1–4 and Enter work too."
              : "Answer, mark for review, open the palette (top right) and submit. The timer turns amber at 25% and red at 10%."}
          </p>
        </>
      }
    >
      {result ? (
        <div className="resultHost">
          <TestResult
            type="topic"
            lang={lang}
            data={{
              score: result.correct,
              maxScore: qs.length,
              cutoff: 3,
              correct: result.correct,
              wrong: result.wrong,
              skipped: result.skipped,
              timeTakenSec: result.timeTakenSec,
              mastery: { topic: lang === "hi" ? "बाल विकास" : "Child Development", from: 1, to: result.correct >= 4 ? 2 : 1 },
            }}
            onSecondary={() => setRun((r) => r + 1)}
          />
        </div>
      ) : (
        <MiniTest
          key={`${layout}-${lang}-${run}`}
          layout={layout}
          lang={lang}
          title={lang === "hi" ? "बाल विकास · मिनी टेस्ट" : "Child Development · Mini test"}
          questions={qs}
          minutes={3}
          onFinish={setResult}
          onExit={() => setRun((r) => r + 1)}
        />
      )}
    </Panel>
  );
}

/* ------------------------------ PDF download ------------------------------ */

type Net = "normal" | "slow" | "fail";

/** Simulated network for the gallery. In the app use useFileDownload(url, { fileName }). */
function useFakeDownload(sizeMb: number, net: Net) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const total = Math.round(sizeMb * 1024 * 1024);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const start = () => {
    clear();
    setStatus("preparing");
    setProgress(0);
    const prep = net === "slow" ? 1600 : 900;
    const dur = (net === "slow" ? 2600 : 1200) * Math.max(1, sizeMb / 2);
    timers.current.push(setTimeout(() => setStatus("downloading"), prep));
    const steps = 24;
    for (let k = 1; k <= steps; k++) {
      const p = k / steps;
      timers.current.push(setTimeout(() => {
        if (net === "fail" && p > 0.6) { clear(); setStatus("error"); return; }
        setProgress(Math.min(0.99, p * p * (3 - 2 * p)));
      }, prep + (dur * k) / steps));
    }
    if (net !== "fail") timers.current.push(setTimeout(() => { setProgress(1); setStatus("done"); }, prep + dur + 120));
  };
  const cancel = () => { clear(); setStatus("idle"); setProgress(0); };
  return { status, progress, loadedBytes: Math.round(progress * total), totalBytes: total, start, cancel };
}

function DemoCard({ pdf, net, lang, variant }: { pdf: { title: string; meta: string; size: number }; net: Net; lang: Lang; variant: "card" | "button" }) {
  const d = useFakeDownload(pdf.size, net);
  return (
    <DownloadCard
      variant={variant}
      title={pdf.title}
      meta={pdf.meta}
      status={d.status}
      progress={d.progress}
      loadedBytes={d.loadedBytes}
      totalBytes={d.totalBytes}
      lang={lang}
      onDownload={d.start}
      onCancel={d.cancel}
      onRetry={d.start}
      onOpen={d.cancel}
    />
  );
}

export function PdfPanel() {
  const [lang, setLang] = useState<Lang>("en");
  const [net, setNet] = useState<Net>("normal");
  const [run, setRun] = useState(0);
  return (
    <Panel
      title="PDF downloads"
      intro={<>A file card for lists and a morphing button for single actions. Real progress comes from <code>useFileDownload()</code>, which streams the file, reports bytes, supports cancel and saves it.</>}
      controls={
        <>
          <Seg id="pn" label="Network" value={net} onChange={(v) => { setNet(v); setRun((r) => r + 1); }} options={[["normal", "Normal"], ["slow", "Slow"], ["fail", "Fails"]]} />
          <Seg id="pl" label="Copy" value={lang} onChange={(v) => { setLang(v); setRun((r) => r + 1); }} options={[["en", "English"], ["hi", "हिंदी"]]} />
          <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>Reset</button>
          <p className="note">Tap Download. While it runs, tap the ring to cancel. "Fails" stops at 60% to show the error state.</p>
        </>
      }
    >
      <div className="app" key={`${run}-${lang}-${net}`}>
        <div className="appBar"><span className="mockLogo">Clear <span>Cutoff</span></span></div>
        <h3>{lang === "hi" ? "PDF और नोट्स" : "PDFs & notes"}</h3>
        <p className="appSub">{lang === "hi" ? "ऑफ़लाइन पढ़ने के लिए डाउनलोड करें" : "Download to study offline"}</p>
        <div className="pdfList">
          {PDFS[lang].map((p) => <DemoCard key={p.title} pdf={p} net={net} lang={lang} variant="card" />)}
        </div>
        <p className="appSub" style={{ marginTop: 18 }}>{lang === "hi" ? "बटन वेरिएंट" : "Button variant"}</p>
        <DemoCard pdf={PDFS[lang][2]} net={net} lang={lang} variant="button" />
      </div>
    </Panel>
  );
}
