"use client";

import { useEffect, useRef, useState } from "react";
import { Meter, useMeterK, type MeterHandle } from "./Meter";
import { Nib } from "./Nib";
import { useFx } from "./effects";
import { SMAX, SUBJ, type MeterAction, type MeterState } from "./data";
import styles from "./meters.module.css";
import { DEFAULT_SCALE, ZONES, gapText, tr, zoneOf, type Lang, type MeterScale, type MeterVariant } from "./zones";

/** 5-point trend sparkline in the zone colour. */
import { Sparkline } from "./Sparkline";

export { Sparkline };

function Action({ a, i, k, lang }: { a: MeterAction; i: number; k: number; lang: Lang }) {
  return (
    <div className={styles.act} style={{ animationDelay: `${(450 + i * 120) * k}ms` }}>
      <span className={styles.actN}>{i + 1}</span>
      <div className={styles.actTx}>
        <b>{tr(a.t, lang)}</b>
        <span>{a.time}</span>
      </div>
      <span className={[styles.imp, a.neu && styles.neu].filter(Boolean).join(" ")}>{a.imp}</span>
      <button type="button" className={styles.go} aria-label={a.cta}>
        →
      </button>
    </div>
  );
}

/**
 * The full Cutoff Meter screen for one state, as the student sees it on a phone: app bar with
 * exam chip, meter card (meter + gap line + 5-week trend), Nibbu's line, the next 3 moves and
 * the section breakdown. Plays the state's entrance animation on mount — re-key to replay.
 */
export function MeterScreen({
  state: s,
  lang = "en",
  variant = "gauge",
  scale = DEFAULT_SCALE,
}: {
  state: MeterState;
  lang?: Lang;
  variant?: MeterVariant;
  scale?: MeterScale;
}) {
  const k = useMeterK();
  const meter = useRef<MeterHandle>(null);
  const fx = useFx(k);
  const [barsOn, setBarsOn] = useState(false);
  const z = s.score == null ? "locked" : zoneOf(s.score, scale);
  const exam = s.exam || 41;
  const hot = exam <= 7;

  let total = 0;
  (s.acts || []).forEach((a) => {
    const m = /^\+(\d+) marks?$/.exec(a.imp);
    if (m) total += +m[1];
  });
  const covers = s.score != null && s.score < scale.cutoff && total >= scale.cutoff - s.score;

  useEffect(() => {
    const m = meter.current;
    if (!m) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms * k));
    if (s.score == null) {
      m.lock(true);
      return;
    }
    const score = s.score;
    if (s.cool) m.cool(false);
    const start = s.prev != null ? s.prev : 0;
    void m.set(start, { dur: 1, band: 0 });
    at(() => {
      void m.set(score, { band: s.band, dur: s.prev != null ? 900 : 1150 });
      if (s.prev != null) {
        const prev = s.prev;
        at(() => {
          m.delta(score - prev);
          if (score < prev && !s.cool) m.wobble();
        }, 500);
      }
      if (s.cool) at(() => m.cool(true), 700);
      if (s.k === "cleared") {
        at(() => {
          fx.api.confetti();
          fx.api.stamp(tr({ en: "Cleared ✓", hi: "क्लियर ✓" }, lang), 2200);
        }, 1000);
      }
      setBarsOn(true);
    }, 250);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjPct = s.subj ? s.subj.map((v, i) => v / SMAX[i]) : [];
  const minPct = subjPct.length ? Math.min(...subjPct) : 0;

  return (
    <div className={`${styles.scope} ${styles.screen}`}>
      <div className={styles.appbar}>
        <span className={styles.back}>←</span>
        <div className={styles.ttl}>
          <b>{tr({ en: "Cutoff Meter", hi: "कटऑफ़ मीटर" }, lang)}</b>
          <span>by ClearCutoff · HTET L2</span>
        </div>
        <span className={[styles.examchip, hot && styles.hot].filter(Boolean).join(" ")}>
          {hot ? "🔥 " : ""}
          {tr({ en: `Exam in ${exam} days`, hi: `परीक्षा ${exam} दिन में` }, lang)}
        </span>
      </div>

      <div className={[styles.mcard, s.cool && styles.cool].filter(Boolean).join(" ")}>
        <div className={styles.mhost}>
          <Meter ref={meter} variant={variant} lang={lang} scale={scale} />
        </div>
        <div className={styles.gapline}>
          {tr(gapText(s.score, scale), lang)}
          {s.score != null && (
            <small>
              {tr(
                {
                  en: `Range ±${s.band} · based on ${s.tests} test${s.tests > 1 ? "s" : ""}`,
                  hi: `दायरा ±${s.band} · ${s.tests} टेस्ट के आधार पर`,
                },
                lang,
              )}
            </small>
          )}
        </div>
        {s.trend && s.trend.length > 1 ? (
          <div className={styles.metarow}>
            <span>{tr({ en: "Last 5 weeks", hi: "पिछले 5 हफ़्ते" }, lang)}</span>
            <span className={styles.spark}>
              <Sparkline trend={s.trend} zone={z} />{" "}
              <b>
                {s.trend[s.trend.length - 1] - s.trend[0] >= 0 ? "+" : ""}
                {s.trend[s.trend.length - 1] - s.trend[0]}
              </b>
            </span>
          </div>
        ) : (
          <div className={styles.metarow}>
            <span>{tr({ en: "Accuracy target", hi: "सटीकता लक्ष्य" }, lang)}</span>
            <b>{tr({ en: "±5% of real score", hi: "असली स्कोर के ±5%" }, lang)}</b>
          </div>
        )}
        {fx.nodes}
      </div>

      <div className={styles.bubble}>
        <div className={styles.nibbox}>
          <Nib mood={s.mood} accessory={s.acc} bob />
        </div>
        <p>{tr(s.head, lang)}</p>
      </div>

      <div className={styles.sec}>
        {tr({ en: "Your next moves", hi: "आपके अगले कदम" }, lang)}
        {covers && <em>✓ {tr({ en: "These cover your gap", hi: "ये आपका गैप पूरा करते हैं" }, lang)}</em>}
      </div>
      <div className={styles.acts}>
        {s.acts.map((a, i) => (
          <Action key={i} a={a} i={i} k={k} lang={lang} />
        ))}
      </div>

      <div className={styles.sec}>{tr({ en: "Where your marks come from", hi: "आपके अंक कहाँ से आ रहे हैं" }, lang)}</div>
      {s.subj ? (
        <div className={styles.subj}>
          {s.subj.map((v, i) => {
            const p = subjPct[i];
            const c = p < 0.5 ? ZONES.need.c : p < 0.6 ? ZONES.almost.c : ZONES.clear.c;
            return (
              <div key={i} className={styles.srow}>
                <span>
                  {tr(SUBJ[i], lang)}
                  {p === minPct && <span className={styles.weak}>{tr({ en: "weakest", hi: "सबसे कमज़ोर" }, lang)}</span>}
                </span>
                <span className={styles.bar0}>
                  <i style={{ width: barsOn ? `${p * 100}%` : 0, background: c }} />
                </span>
                <b>
                  {v}/{SMAX[i]}
                </b>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.locknote}>
          {tr(
            s.k === "locked"
              ? { en: "Section breakdown unlocks after your first test.", hi: "पहले टेस्ट के बाद सेक्शन-वार ब्योरा दिखेगा।" }
              : { en: "Section breakdown unlocks after 3 tests. 2 to go.", hi: "3 टेस्ट के बाद सेक्शन-वार ब्योरा दिखेगा। 2 बाकी।" },
            lang,
          )}
        </div>
      )}
    </div>
  );
}
