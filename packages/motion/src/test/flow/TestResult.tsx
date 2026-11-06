"use client";

import type { CSSProperties, ReactNode } from "react";
import f from "./flow.module.css";
import s from "./result.module.css";
import { NibMascot } from "../../nibbu/NibMascot";
import { COPY, OUTCOME_COPY, TYPE_LABEL, fill, lastSevenDays, marksAway } from "./copy";
import { useCountUp, usePrefersReducedMotion } from "../../core/useCountUp";
import { getOutcome, type Lang, type ResultData, type TestType } from "./types";

export type TestResultProps = {
  type: TestType;
  data: ResultData;
  lang?: Lang;
  /** Override the auto-detected weakest area used in the copy. */
  weakArea?: string;
  onReview?: () => void;
  /** topic → next topic · daily → dashboard · full → retry */
  onSecondary?: () => void;
  /** Replaces the two default buttons with the host's own (e.g. the app's Button component). onReview/onSecondary are then unused. */
  actions?: ReactNode | false;
  /** Badge text override (e.g. "Practice test"); the design still follows `type`. */
  label?: string;
  /** Desktop (>=1024px) two-column layout (ring left, text + stats right) for full-page hosts; modals keep the stacked layout. */
  wide?: boolean;
};

const RING_DELAY = 300;
const RING_MS = 1400;

export function TestResult({ type, data, lang = "en", weakArea, onReview, onSecondary, actions, label, wide }: TestResultProps) {
  const reduced = usePrefersReducedMotion();
  const outcome = getOutcome(data);
  const cutoff = data.cutoff ?? Math.round(data.maxScore * 0.6);
  const pct = Math.max(0, Math.min(100, (data.score / data.maxScore) * 100));
  const cutoffPct = (cutoff / data.maxScore) * 100;
  const shownScore = useCountUp(data.score, { duration: RING_MS, delay: RING_DELAY });
  const shownPct = data.score ? (shownScore / data.score) * pct : 0;
  const attempted = data.correct + data.wrong;
  const accuracy = attempted ? Math.round((data.correct / attempted) * 100) : 0;

  const weak = weakArea ?? weakest(data) ?? (lang === "hi" ? "गलत सवालों" : "your wrong answers");
  const gap = marksAway(Math.max(0, Math.ceil(cutoff - data.score)), lang);
  const copy = OUTCOME_COPY[outcome];
  const secondaryLabel = type === "topic" ? COPY.nextTopic : type === "daily" ? COPY.dashboard : COPY.retry;

  // cutoff tick position on the ring (12 o'clock = 0)
  const a = (cutoffPct / 100) * 2 * Math.PI - Math.PI / 2;
  const tick = { x1: 100 + 72 * Math.cos(a), y1: 100 + 72 * Math.sin(a), x2: 100 + 97 * Math.cos(a), y2: 100 + 97 * Math.sin(a) };

  return (
    <section className={`${f.root} ${s.result} ${s[outcome]}${wide ? ` ${s.wide}` : ""}`} aria-labelledby="cc-result-title">
      <span className={f.srOnly} role="status">
        {`${data.score} / ${data.maxScore}. ${COPY.cutoff[lang]} ${cutoff}. ${fill(copy.title[lang], { gap })}`}
      </span>

      <span className={`${f.badge} ${f[type]} ${s.badge}`}>{label ?? TYPE_LABEL[type][lang]}</span>

      <div className={s.hero} aria-hidden="true">
        {outcome === "pass" && !reduced && <Confetti />}
        <span className={s.glow} />
        <svg className={s.ring} viewBox="0 0 200 200">
          <circle className={s.track} cx="100" cy="100" r="84" />
          <circle
            className={s.arc}
            cx="100"
            cy="100"
            r="84"
            pathLength={100}
            style={{ strokeDashoffset: 100 - shownPct }}
          />
          <line className={s.cutTick} {...tick} />
        </svg>
        <div className={s.center}>
          <span className={s.score}>{Math.round(shownScore)}</span>
          <span className={s.max}>/ {data.maxScore}</span>
          <span className={s.cutChip}>
            {COPY.cutoff[lang]} {cutoff}
          </span>
        </div>
        <div className={s.buddy}>
          <div className={s.buddyMove}>
            <NibMascot
              className={f.mascot}
              mood={outcome === "pass" ? "happy" : "determined"}
              accessory={outcome === "pass" ? "cap" : "headband"}
            />
          </div>
        </div>
      </div>

      <h2 id="cc-result-title" className={s.title}>{fill(copy.title[lang], { gap })}</h2>
      <p className={s.sub}>{fill(copy.sub[lang], { weak })}</p>

      <div className={s.stats}>
        <Stat label={COPY.correct[lang]} value={data.correct} tone="ok" i={0} />
        <Stat label={COPY.wrong[lang]} value={data.wrong} tone="bad" i={1} />
        <Stat label={COPY.skipped[lang]} value={data.skipped} tone="skip" i={2} />
        <Stat label={COPY.accuracy[lang]} value={accuracy} suffix="%" tone="acc" i={3} />
      </div>
      {(data.timeTakenSec !== undefined || data.rank) && (
      <p className={s.timeLine}>
        {data.timeTakenSec !== undefined && (
          <>
            {COPY.time[lang]}: <b>{fmtTime(data.timeTakenSec)}</b>
          </>
        )}
        {data.rank && (
          <>
            {"  ·  "}
            {COPY.rank[lang]} <b>{data.rank.rank.toLocaleString("en-IN")}</b> {COPY.of[lang]} {data.rank.of.toLocaleString("en-IN")}
          </>
        )}
      </p>
      )}

      {type === "full" && data.sections && <Sections sections={data.sections} lang={lang} />}
      {type === "daily" && data.streak && <Streak streak={data.streak} lang={lang} />}
      {type === "topic" && data.mastery && <Mastery m={data.mastery} lang={lang} />}

      {actions !== false && (
      <div className={s.ctas}>
        {actions ?? (
          <>
            <button type="button" className={`${f.btn} ${f.primary}`} onClick={onReview}>
              {COPY.review[lang]}
            </button>
            <button type="button" className={`${f.btn} ${f.secondary}`} onClick={onSecondary}>
              {secondaryLabel[lang]}
            </button>
          </>
        )}
      </div>
      )}
    </section>
  );
}

function Stat({ label, value, suffix = "", tone, i }: { label: string; value: number; suffix?: string; tone: string; i: number }) {
  const delay = 1500 + i * 120;
  const v = useCountUp(value, { duration: 700, delay });
  return (
    <div className={`${s.stat} ${s[tone]}`} style={{ animationDelay: `${delay}ms` }}>
      <span className={s.statVal}>
        {Math.round(v)}
        {suffix}
      </span>
      <span className={s.statLabel}>
        <i />
        {label}
      </span>
    </div>
  );
}

function Sections({ sections, lang }: { sections: NonNullable<ResultData["sections"]>; lang: Lang }) {
  return (
    <div className={s.card} style={{ animationDelay: "1.9s" }}>
      <h3 className={s.cardTitle}>{COPY.sections[lang]}</h3>
      <div className={s.secList}>
        {sections.map((sec, i) => {
          const p = sec.max ? sec.score / sec.max : 0;
          const tone = p >= 0.6 ? s.ok : p >= 0.4 ? s.mid : s.bad;
          return (
            <div key={sec.name} className={`${s.sec} ${tone}`}>
              <span className={s.secName}>{sec.name}</span>
              <span className={s.secVal}>
                {sec.score}/{sec.max}
              </span>
              <span className={s.secBar}>
                <span style={{ "--p": p, animationDelay: `${2.05 + i * 0.12}s` } as CSSProperties} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Streak({ streak, lang }: { streak: NonNullable<ResultData["streak"]>; lang: Lang }) {
  const week = lastSevenDays(lang);
  return (
    <div className={`${s.card} ${s.streakCard}`} style={{ animationDelay: "1.9s" }}>
      <svg className={s.miniFlame} viewBox="0 0 70 90" aria-hidden="true">
        <path fill="#ff6a1f" d="M35 4C40 22 62 30 62 56c0 18-12 30-27 30S8 74 8 56c0-14 8-22 14-30 2 10 6 14 10 14-2-12-2-24 3-36Z" />
        <path fill="#ffd34d" d="M35 40c5 12 15 16 15 26 0 10-7 16-15 16s-15-6-15-16c0-8 6-12 8-18 2 6 4 8 6 8-1-6-1-10 1-16Z" />
      </svg>
      <div className={s.streakText}>
        <span className={s.flip} aria-hidden="true">
          <span>{streak.days - 1}</span>
          <span>{streak.days}</span>
        </span>
        <span className={f.srOnly}>{streak.days}</span>
        <span className={s.streakLabel}>{COPY.dayStreak[lang]}</span>
      </div>
      <div className={s.week}>
        {streak.week.map((on, i) => (
          <span key={i} className={`${s.day} ${on ? s.dayOn : ""} ${i === streak.week.length - 1 ? s.today : ""}`}>
            <i />
            {week[i]}
          </span>
        ))}
      </div>
      <p className={s.streakNote}>
        {lang === "hi" ? `कल आकर ${streak.days + 1} दिन की स्ट्रीक बनाएँ` : `Come back tomorrow for day ${streak.days + 1}`}
      </p>
    </div>
  );
}

function Mastery({ m, lang }: { m: NonNullable<ResultData["mastery"]>; lang: Lang }) {
  const levels = COPY.levels[lang];
  const pos = (lvl: number) => `${(lvl / (levels.length - 1)) * 100}%`;
  const up = m.to > m.from;
  return (
    <div className={s.card} style={{ animationDelay: "1.9s" }}>
      <h3 className={s.cardTitle}>
        {COPY.mastery[lang]} · {m.topic}
        {up && <span className={s.levelUp}>{lang === "hi" ? "लेवल अप!" : "Level up!"}</span>}
      </h3>
      <div className={s.track2}>
        <span className={s.trackFill} style={{ "--from": pos(m.from), "--to": pos(m.to) } as CSSProperties} />
        <span className={s.dot} style={{ "--from": pos(m.from), "--to": pos(m.to) } as CSSProperties} />
      </div>
      <div className={s.levels}>
        {levels.map((l, i) => (
          <span key={l} className={i <= m.to ? s.lvlOn : undefined}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/** Deterministic burst (SSR-safe — no Math.random). */
function Confetti() {
  const colors = ["#0083ff", "#12b76a", "#ffc542", "#ff6a1f", "#ff9bb0", "#005cb8"];
  return (
    <span className={s.confetti}>
      {Array.from({ length: 26 }, (_, i) => {
        const ang = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 70 + ((i * 37) % 60);
        const style = {
          "--x": `${Math.cos(ang) * dist}px`,
          "--up": `${-60 - ((i * 23) % 50)}px`,
          "--down": `${70 + ((i * 29) % 70)}px`,
          "--r": `${((i * 97) % 720) - 360}deg`,
          background: colors[i % colors.length],
          width: i % 4 === 0 ? "6px" : "8px",
          height: i % 4 === 0 ? "6px" : "4px",
          borderRadius: i % 4 === 0 ? "50%" : "1px",
          animationDelay: `${1.65 + (i % 5) * 0.03}s`,
        } as CSSProperties;
        return <i key={i} style={style} />;
      })}
    </span>
  );
}

function weakest(d: ResultData) {
  if (d.sections?.length) {
    return [...d.sections].sort((a, b) => a.score / a.max - b.score / b.max)[0].name;
  }
  return d.mastery?.topic;
}

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
