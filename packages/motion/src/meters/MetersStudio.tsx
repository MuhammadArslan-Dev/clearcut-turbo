"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Meter, MeterMotionContext, useMeterK, type MeterHandle } from "./Meter";
import { MeterScreen } from "./MeterScreen";
import { Nib } from "./Nib";
import { useFx } from "./effects";
import { MOMENTS, type MeterMoment } from "./moments";
import { STATES, stateByKey, type StateKey } from "./data";
import type { NibAccessory, NibMood } from "../nibbu";
import styles from "./meters.module.css";
import { DEFAULT_SCALE, ZONES, gapText, segments, tr, zoneOf, type Lang, type MeterVariant } from "./zones";

type View = "states" | "all-states" | "moments" | "surfaces" | "logic";
const VIEWS: [View, string][] = [
  ["states", "States"],
  ["all-states", "All states"],
  ["moments", "Animations"],
  ["surfaces", "Where it shows"],
  ["logic", "Logic & spec"],
];

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------------- States ---------------- */

function StatesView({ lang, variant, cur, setCur }: { lang: Lang; variant: MeterVariant; cur: StateKey; setCur: (k: StateKey) => void }) {
  const [run, setRun] = useState(0);
  const s = stateByKey(cur);
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2>States</h2>
          <p>Pick a state to see the full meter screen and its animation. On the right: the actions with their reasoning, and build notes for the team.</p>
        </div>
        <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
          Replay
        </button>
      </div>
      <div className={styles.layout}>
        <div className={styles.statelist}>
          {STATES.map((st) => {
            const z = st.score == null ? "locked" : zoneOf(st.score);
            const dot = st.cool ? "#7fa6cf" : st.band >= 12 ? "#0083ff" : ZONES[z].c;
            return (
              <button key={st.k} type="button" className={styles.statebtn} aria-pressed={st.k === cur} onClick={() => { setCur(st.k); setRun((r) => r + 1); }}>
                <i style={{ background: dot }} />
                <div>
                  <b>{tr(st.lab, lang)}</b>
                  <span>
                    {st.desc}
                    {st.score != null ? ` · ${st.score}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className={styles.phone}>
          <div className={styles.notch} />
          <MeterScreen key={`${cur}-${lang}-${variant}-${run}`} state={s} lang={lang} variant={variant} />
        </div>
        <div className={styles.side}>
          <div className={styles.card}>
            <h3>{tr({ en: "Actionables for the student", hi: "छात्र के लिए अगले कदम" }, lang)}</h3>
            <p className={styles.lead}>Ranked by expected marks per minute. Each has a reason drawn from the student’s own data.</p>
            <div className={styles.alist}>
              {s.acts.map((a, i) => (
                <div key={i} className={styles.aitem}>
                  <div className={styles.aitemH}>
                    <b>
                      {i + 1}. {tr(a.t, lang)}
                    </b>
                    <span className={cx(styles.imp, a.neu && styles.neu)}>{a.imp}</span>
                  </div>
                  <p>{a.why}</p>
                  <div className={styles.tags}>
                    <span className={styles.tag}>⏱ {a.time}</span>
                    <span className={styles.tag}>CTA: {a.cta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <h3>Build notes for the team</h3>
            <p className={styles.lead}>What triggers this state and how it should behave.</p>
            <dl className={styles.notes}>
              <dt>Trigger</dt>
              <dd>{s.notes.trigger}</dd>
              <dt>Motion</dt>
              <dd>{s.notes.motion}</dd>
              <dt>Nibbu</dt>
              <dd>
                <code>{`<NibMascot mood="${s.mood}"${s.acc !== "none" ? ` accessory="${s.acc}"` : ""} />`}</code>
              </dd>
              <dt>Copy rule</dt>
              <dd>{s.notes.copy}</dd>
              <dt>Events</dt>
              <dd>
                <code>{s.notes.events}</code>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- All states ---------------- */

function AllStateCard({ i, k, lang, variant, onOpen }: { i: number; k: StateKey; lang: Lang; variant: MeterVariant; onOpen: () => void }) {
  const kk = useMeterK();
  const m = useRef<MeterHandle>(null);
  const s = stateByKey(k);
  useEffect(() => {
    const meter = m.current;
    if (!meter) return;
    if (s.score == null) {
      meter.lock(true);
      return;
    }
    const score = s.score;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(
      setTimeout(() => {
        void meter.set(score, { band: s.band });
        if (s.cool) ts.push(setTimeout(() => meter.cool(true), 600 * kk));
      }, (200 + i * 90) * kk),
    );
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <button type="button" className={styles.acard} onClick={onOpen}>
      <div>
        <Meter ref={m} size="sm" variant={variant} lang={lang} />
      </div>
      <h4>{tr(s.lab, lang)}</h4>
      <p>{tr(gapText(s.score), lang)}</p>
      <div className={styles.top1}>→ {tr(s.acts[0].t, lang)}</div>
    </button>
  );
}

function AllStatesView({ lang, variant, open }: { lang: Lang; variant: MeterVariant; open: (k: StateKey) => void }) {
  const [run, setRun] = useState(0);
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2>All states at a glance</h2>
          <p>Every state side by side. Tap a card to open it in full.</p>
        </div>
        <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
          Replay
        </button>
      </div>
      <div className={styles.agrid}>
        {STATES.map((s, i) => (
          <AllStateCard key={`${s.k}-${lang}-${variant}-${run}`} i={i} k={s.k} lang={lang} variant={variant} onOpen={() => open(s.k)} />
        ))}
      </div>
    </>
  );
}

/* ---------------- Animations ---------------- */

function MomentStage({ mo, variant, lang, delay }: { mo: MeterMoment; variant: MeterVariant; lang: Lang; delay: number }) {
  const k = useMeterK();
  const m = useRef<MeterHandle>(null);
  const fx = useFx(k);
  const [nib, setNib] = useState<{ mood: NibMood; acc: NibAccessory; pop: boolean; n: number }>({ mood: "happy", acc: "none", pop: false, n: 0 });
  const [label, setLabel] = useState(mo.trig);
  useEffect(() => {
    let alive = true;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms * k));
    const t = setTimeout(() => {
      const meter = m.current;
      if (!alive || !meter) return;
      void mo.run({
        m: meter,
        fx: fx.api,
        nib: (mood, acc = "none", pop = false) => alive && setNib((x) => ({ mood, acc, pop, n: x.n + 1 })),
        label: (txt) => alive && setLabel(txt),
        wait,
        variant,
      });
    }, delay * k);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={styles.stage}>
      <div>
        <Meter ref={m} variant={variant} lang={lang} />
      </div>
      <div className={styles.nibcorner}>
        <Nib key={nib.n} mood={nib.mood} accessory={nib.acc} pop={nib.pop} />
      </div>
      <span className={styles.label}>{label}</span>
      {fx.nodes}
    </div>
  );
}

function MomentCard({ mo, i, variant, lang, all }: { mo: MeterMoment; i: number; variant: MeterVariant; lang: Lang; all: number }) {
  const [run, setRun] = useState(0);
  const delay = run > 0 ? 0 : all > 0 ? i * 120 : 150 + i * 160;
  return (
    <div className={styles.mom}>
      <MomentStage key={`${variant}-${lang}-${all}-${run}`} mo={mo} variant={variant} lang={lang} delay={delay} />
      <div className={styles.momMeta}>
        <b>{mo.t}</b>
        <p>{mo.p}</p>
        <div className={styles.momRow}>
          <span className={styles.tim}>{mo.tim}</span>
          <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}

function MomentsView({ lang, variant }: { lang: Lang; variant: MeterVariant }) {
  const [all, setAll] = useState(0);
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2>Animations</h2>
          <p>Each moment, what triggers it and its timing. Switch Gauge / Fill bar at the top to compare both styles. Turn on slow motion to review.</p>
        </div>
        <button type="button" className={styles.replay} onClick={() => setAll((a) => a + 1)}>
          Replay all
        </button>
      </div>
      <div className={styles.mgrid}>
        {MOMENTS.map((mo, i) => (
          <MomentCard key={`${mo.id}-${all}`} mo={mo} i={i} variant={variant} lang={lang} all={all} />
        ))}
      </div>
    </>
  );
}

/* ---------------- Where it shows ---------------- */

export function MeterSurfaces({ lang = "en", variant = "gauge" }: { lang?: Lang; variant?: MeterVariant }) {
  const k = useMeterK();
  const hi = lang === "hi";
  const res = useRef<MeterHandle>(null);
  const [barsOn, setBarsOn] = useState(false);
  useEffect(() => {
    const ts = [setTimeout(() => setBarsOn(true), 200 * k)];
    const meter = res.current;
    if (meter) {
      void meter.set(82, { dur: 1, band: 6 });
      ts.push(
        setTimeout(() => {
          meter.delta(4);
          void meter.set(86, { band: 6 });
        }, 700 * k),
      );
    }
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={`${styles.scope} ${styles.sgrid}`}>
      <div className={styles.card}>
        <h3>Home tile</h3>
        <div className={styles.tile}>
          <div style={{ width: 52 }}>
            <Nib mood="determined" bob />
          </div>
          <div className={styles.tileTx}>
            <b>{hi ? "कटऑफ़ मीटर · 82/150" : "Cutoff Meter · 82/150"}</b>
            <div className={styles.minibar}>
              <i style={{ width: barsOn ? `${(82 / 150) * 100}%` : 0, background: "#f79009" }} />
              <u style={{ left: "60%" }} />
            </div>
            <span>{hi ? "क्लियर ज़ोन से 8 अंक दूर · 3 कदम तैयार" : "8 marks to Clear Zone · 3 moves ready"}</span>
          </div>
          <button type="button" className={styles.go}>
            →
          </button>
        </div>
        <p className={styles.cap}>Top of Home, above everything else. Replaces the generic “Continue learning” card. Tap opens the meter screen.</p>
      </div>
      <div className={styles.card}>
        <h3>Locked tile (new users)</h3>
        <div className={styles.tile}>
          <div style={{ width: 52 }}>
            <Nib mood="happy" bob />
          </div>
          <div className={styles.tileTx}>
            <b>{hi ? "कटऑफ़ मीटर 🔒" : "Cutoff Meter 🔒"}</b>
            <div className={styles.minibar} />
            <span>{hi ? "5 सवाल हल करें, जानें आप कहाँ खड़े हैं" : "Answer 5 questions to see where you stand"}</span>
          </div>
          <button type="button" className={styles.go}>
            →
          </button>
        </div>
        <p className={styles.cap}>Shown to everyone with zero tests, including the onboarding-test control group, so the A/B stays clean.</p>
      </div>
      <div className={styles.card}>
        <h3>Test result: meter delta</h3>
        <div className={styles.tile} style={{ flexDirection: "column", alignItems: "stretch", position: "relative" }}>
          <div style={{ fontSize: 13, color: "var(--slate)", fontWeight: 600 }}>{hi ? "इस टेस्ट से आपका मीटर" : "Your meter after this test"}</div>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 6 }}>
            <Meter ref={res} size="sm" variant={variant} lang={lang} />
          </div>
        </div>
        <p className={styles.cap}>Last thing on every result screen. The delta is the reward; the paywall hook sits right below for free users (“Unlock the 3 moves”).</p>
      </div>
      <div className={styles.card}>
        <h3>Header pill in practice</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className={styles.pill2}>
            <span className={styles.dot}>⛳</span>82 / 90
          </span>
          <span className={styles.pill2} style={{ background: "#067a46" }}>
            <span className={styles.dot} style={{ background: "#ffc542" }}>
              ★
            </span>
            94 / 90
          </span>
        </div>
        <p className={styles.cap}>Small pill in the test and practice header. Live ticks (+0.4) animate here so students feel every answer counting.</p>
      </div>
      <div className={styles.card}>
        <h3>Weekly report</h3>
        <div className={styles.week}>
          <small>{hi ? "इस हफ़्ते" : "This week"} · 3–9 Nov</small>
          <div className={styles.big}>+6 {hi ? "अंक" : "marks"}</div>
          <small>76 → 82 · {hi ? "कटऑफ़ से 8 दूर" : "8 to cutoff"}</small>
          <div className={styles.weekRow}>
            <div>
              {hi ? "सबसे अच्छा कदम" : "Best move"}
              <br />
              <b>Reasoning +3</b>
            </div>
            <div>
              {hi ? "अगला फ़ोकस" : "Next focus"}
              <br />
              <b>संधि-समास</b>
            </div>
          </div>
        </div>
        <p className={styles.cap}>Fits the weekly report you’re already building. Headline is always the meter delta, never time spent.</p>
      </div>
      <div className={styles.card}>
        <h3>Push / WhatsApp nudge</h3>
        <div className={styles.notif}>
          <div className={styles.ic}>
            <Nib mood="happy" />
          </div>
          <div>
            <b>ClearCutoff</b>
            <span>{hi ? "आप क्लियर ज़ोन से सिर्फ़ 3 अंक दूर हैं। आज 10 मिनट का टेस्ट?" : "You’re 3 marks from the Clear Zone. 10-minute test today?"}</span>
          </div>
        </div>
        <div className={styles.notif} style={{ marginTop: 8 }}>
          <div className={styles.ic} style={{ background: "#7fa6cf" }}>
            <Nib mood="sleepy" />
          </div>
          <div>
            <b>ClearCutoff</b>
            <span>{hi ? "आपका मीटर 3 अंक ठंडा हो गया। एक टेस्ट से वापस पाएँ।" : "Your meter cooled by 3. One test brings it back."}</span>
          </div>
        </div>
        <p className={styles.cap}>Every message carries the gap number. That’s what makes a reminder feel personal instead of spammy.</p>
      </div>
    </div>
  );
}

function SurfacesView({ lang, variant }: { lang: Lang; variant: MeterVariant }) {
  const [run, setRun] = useState(0);
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2>Where the meter shows up</h2>
          <p>The meter is the product’s spine: every surface points back to it. One number, same colours everywhere.</p>
        </div>
        <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
          Replay
        </button>
      </div>
      <MeterSurfaces key={`${lang}-${variant}-${run}`} lang={lang} variant={variant} />
    </>
  );
}

/* ---------------- Logic & spec ---------------- */

export function MeterLogic() {
  const cut = DEFAULT_SCALE.cutoff;
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2>Logic &amp; spec (v1 proposal)</h2>
          <p>Starting rules for fixed-cutoff exams. Every threshold here is a proposal to tune once real scores come back against predictions.</p>
        </div>
      </div>
      <div className={styles.lgrid}>
        <div className={styles.card}>
          <h3>Zones</h3>
          <p className={styles.lead}>Relative to the student’s own cutoff, so the same rules work for any fixed-cutoff exam. HTET example: General 60% = 90/150, reserved 55% ≈ 83.</p>
          <table>
            <tbody>
              <tr>
                <th>Zone</th>
                <th>Rule</th>
                <th>HTET General</th>
              </tr>
              {segments().map(([, , zk]) => {
                const z = ZONES[zk];
                const rule = zk === "need" ? "< cutoff − 15" : zk === "almost" ? "cutoff − 15 to cutoff − 1" : zk === "clear" ? "cutoff to cutoff + 9" : "≥ cutoff + 10 and range ≤ ±5";
                const ex = zk === "need" ? `< ${cut - 15}` : zk === "almost" ? `${cut - 15}–${cut - 1}` : zk === "clear" ? `${cut}–${cut + 9}` : `≥ ${cut + 10}`;
                return (
                  <tr key={zk}>
                    <td>
                      <span className={styles.sw} style={{ background: z.c }} />
                      <b>{z.lab.en}</b> · {z.lab.hi}
                    </td>
                    <td>{rule}</td>
                    <td>{ex}</td>
                  </tr>
                );
              })}
              <tr>
                <td>
                  <span className={styles.sw} style={{ background: "#b7c7d8" }} />
                  <b>Locked</b>
                </td>
                <td>0 tests</td>
                <td>—</td>
              </tr>
              <tr>
                <td>
                  <span className={styles.sw} style={{ background: "#7fa6cf" }} />
                  <b>Cooling</b>
                </td>
                <td>Overlay on any zone after 3+ idle days</td>
                <td>−1/day, cap −5</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.card}>
          <h3>Range (confidence band)</h3>
          <p className={styles.lead}>Shown as the shaded arc. Shrinks with evidence; this is what earns trust.</p>
          <table>
            <tbody>
              <tr>
                <th>Evidence</th>
                <th>Range</th>
                <th>Pill shows</th>
              </tr>
              <tr>
                <td>1–2 tests or &lt; 60 Qs</td>
                <td>±15</td>
                <td>Early estimate</td>
              </tr>
              <tr>
                <td>3–6 tests</td>
                <td>±10 → ±7</td>
                <td>Zone name</td>
              </tr>
              <tr>
                <td>7+ tests incl. 1 full mock</td>
                <td>±6 → ±4</td>
                <td>Zone name</td>
              </tr>
              <tr>
                <td>Goal</td>
                <td colSpan={2}>Final prediction within ±5% of actual exam score</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.card}>
          <h3>What moves the meter</h3>
          <table>
            <tbody>
              <tr>
                <th>Event</th>
                <th>Effect</th>
                <th>Animation</th>
              </tr>
              <tr>
                <td>Question answered (practice)</td>
                <td>Tiny live update</td>
                <td>Live tick</td>
              </tr>
              <tr>
                <td>Topic / daily test submitted</td>
                <td>Recalculate, normal weight</td>
                <td>Rise / drop</td>
              </tr>
              <tr>
                <td>Full mock submitted</td>
                <td>Recalculate, highest weight</td>
                <td>Rise / drop, range tightens</td>
              </tr>
              <tr>
                <td>3+ idle days</td>
                <td>Decay, reversible</td>
                <td>Cooling</td>
              </tr>
              <tr>
                <td>First time ≥ cutoff</td>
                <td>Zone change</td>
                <td>Crossing (once only)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.card}>
          <h3>How the 3 moves are picked</h3>
          <table>
            <tbody>
              <tr>
                <th>Step</th>
                <th>Rule</th>
              </tr>
              <tr>
                <td>1. Candidates</td>
                <td>Weak sections, weak topics, blank answers, unfinished chapters, wrong PYQs.</td>
              </tr>
              <tr>
                <td>2. Score</td>
                <td>Expected marks gained ÷ minutes needed, weighted by section marks (Subject 60 &gt; others 30).</td>
              </tr>
              <tr>
                <td>3. Pick</td>
                <td>Top 3, max 1 strategy tip. When below cutoff, try to make the sum ≥ gap.</td>
              </tr>
              <tr>
                <td>4. Final week</td>
                <td>Only revision, PYQ repeats, timed mocks, strategic skips. No new chapters.</td>
              </tr>
              <tr>
                <td>5. Learn</td>
                <td>Log which action was clicked and the meter change after it; re-rank by real lift.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.card}>
          <h3>Motion tokens</h3>
          <table>
            <tbody>
              <tr>
                <th>Token</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Sweep / move</td>
                <td>1150 ms · cubic-bezier(.34,1.56,.64,1)</td>
              </tr>
              <tr>
                <td>Drop</td>
                <td>900 ms · ease-out, no overshoot</td>
              </tr>
              <tr>
                <td>Delta chip</td>
                <td>1600 ms float + fade</td>
              </tr>
              <tr>
                <td>Celebration</td>
                <td>Burst 700 · confetti 1300 · stamp 600 ms</td>
              </tr>
              <tr>
                <td>Final week</td>
                <td>All ≤ 600 ms</td>
              </tr>
              <tr>
                <td>Reduced motion</td>
                <td>Jump to final state, keep delta chip</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>
            Easing curves match the existing Motion Library tokens (<code>--cc-ease-spring</code>, <code>--cc-ease-out</code>).
          </p>
        </div>
        <div className={styles.card}>
          <h3>Copy rules &amp; events</h3>
          <table>
            <tbody>
              <tr>
                <th>Rule</th>
              </tr>
              <tr>
                <td>Always show the gap in marks, never a percentage.</td>
              </tr>
              <tr>
                <td>Every drop names its cause and the way back.</td>
              </tr>
              <tr>
                <td>“Clear Zone” is a prediction: never write “you will pass”.</td>
              </tr>
              <tr>
                <td>Hindi first for Hindi-medium users; same numbers in both languages.</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note} style={{ marginTop: 10 }}>
            Amplitude: <code>meter_viewed</code> · <code>meter_action_clicked</code> · <code>meter_zone_changed</code> · <code>meter_drop_shown</code> · <code>meter_cooling_shown</code> ·{" "}
            <code>meter_unlock_cta_clicked</code>
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------------- Studio shell ---------------- */

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className={styles.seg} role="group" aria-label={label}>
      {options.map(([v, t]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {t}
        </button>
      ))}
    </div>
  );
}

/**
 * The whole Cutoff Meter Studio (states, all states, animations, surfaces, logic) with its
 * toolbar: Gauge / Fill bar, English / हिंदी, slow motion 0.5×. Used by the motion gallery.
 */
export function MetersStudio({ initialView = "states" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [variant, setVariant] = useState<MeterVariant>("gauge");
  const [lang, setLang] = useState<Lang>("en");
  const [slow, setSlow] = useState(false);
  const [cur, setCur] = useState<StateKey>("close");
  const k = slow ? 2 : 1;

  return (
    <MeterMotionContext.Provider value={{ k }}>
      <div className={cx(styles.scope, styles.studio)} style={{ "--k": k } as CSSProperties}>
        <header className={styles.top}>
          <div>
            <h1>
              Cutoff Meter <span>Studio</span>
            </h1>
            <p>
              Every state, animation and surface of the Cutoff Meter (by ClearCutoff), with the next 3 moves each student sees and build notes for the team. Example: HTET Level 2, General
              category, cutoff 90/150.
            </p>
          </div>
          <div className={styles.toolbar}>
            <Seg label="Meter style" value={variant} onChange={setVariant} options={[["gauge", "Gauge"], ["bar", "Fill bar"]]} />
            <Seg label="Language" value={lang} onChange={setLang} options={[["en", "English"], ["hi", "हिंदी"]]} />
            <label className={styles.switch}>
              <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Slow motion 0.5×
            </label>
          </div>
        </header>
        <nav className={styles.tabs} aria-label="Meter sections">
          {VIEWS.map(([v, label]) => (
            <button key={v} type="button" aria-current={view === v ? "page" : undefined} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
        </nav>
        <main key={`${view}-${k}`}>
          {view === "states" && <StatesView lang={lang} variant={variant} cur={cur} setCur={setCur} />}
          {view === "all-states" && <AllStatesView lang={lang} variant={variant} open={(s) => { setCur(s); setView("states"); }} />}
          {view === "moments" && <MomentsView lang={lang} variant={variant} />}
          {view === "surfaces" && <SurfacesView lang={lang} variant={variant} />}
          {view === "logic" && <MeterLogic />}
        </main>
      </div>
    </MeterMotionContext.Provider>
  );
}

export default MetersStudio;
