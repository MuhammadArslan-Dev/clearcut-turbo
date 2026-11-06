"use client";

import { useEffect, useRef, useState } from "react";
import f from "./flow.module.css";
import s from "./intro.module.css";
import { NibMascot } from "../../nibbu/NibMascot";
import { COPY, TYPE_LABEL } from "./copy";
import { usePrefersReducedMotion } from "../../core/useCountUp";
import type { Lang, TestType } from "./types";

export type TestIntroProps = {
  type: TestType;
  title: string;
  /** Omit (or 0) to hide — e.g. while the questions are still loading. */
  questions?: number;
  /** Omit (or 0) to hide — untimed tests such as the topic mini test. */
  minutes?: number;
  marks?: number;
  /** daily: current streak before this test */
  streakDays?: number;
  /** Short checklist shown before the countdown (full mocks). */
  rules?: string[];
  lang?: Lang;
  /** Called when the countdown ends or the user taps Skip. Start your timer here. */
  onStart: () => void;
};

type Phase = "intro" | 3 | 2 | 1 | "go";

export function TestIntro({
  type,
  title,
  questions,
  minutes,
  marks,
  streakDays = 0,
  rules,
  lang = "en",
  onStart,
}: TestIntroProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const done = useRef(false);
  const startRef = useRef(onStart);
  startRef.current = onStart;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    startRef.current();
  };

  useEffect(() => {
    const intro = reduced ? 500 : type === "full" ? 2600 : 1800;
    const beat = reduced ? 450 : 700;
    const steps: [Phase, number][] = [
      [3, intro],
      [2, intro + beat],
      [1, intro + beat * 2],
      ["go", intro + beat * 3],
    ];
    const timers = steps.map(([p, t]) => setTimeout(() => setPhase(p), t));
    timers.push(setTimeout(finish, intro + beat * 3 + (reduced ? 300 : 650)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, reduced]);

  const counting = phase !== "intro";
  const metaParts = [
    questions ? `${questions} ${COPY.questions[lang]}` : null,
    minutes ? `${minutes} ${COPY.minutes[lang]}` : null,
    marks ? `${marks} ${COPY.marks[lang]}` : null,
  ].filter(Boolean);

  return (
    <div className={`${f.root} ${f.overlay}`} role="dialog" aria-modal="true" aria-label={`${TYPE_LABEL[type][lang]}: ${title}`}>
      <div className={`${s.stage} ${s[type]}`}>
        <span className={`${f.badge} ${f[type]}`}>{TYPE_LABEL[type][lang]}</span>
        <h2 className={s.title}>{title}</h2>
        <p className={s.meta}>{metaParts.join(" · ")}</p>

        <div className={s.visual} aria-hidden="true">
          <div className={`${s.layer} ${counting ? s.out : ""}`}>
            {type === "topic" && <TopicVisual />}
            {type === "daily" && <DailyVisual days={streakDays} lang={lang} />}
            {type === "full" && <FullVisual />}
          </div>
          {counting && <Countdown phase={phase} lang={lang} />}
        </div>

        {rules && rules.length > 0 && (
          <ul className={`${s.rules} ${counting ? s.rulesDim : ""}`}>
            {rules.map((r, i) => (
              <li key={r} style={{ animationDelay: `${0.5 + i * 0.35}s` }}>
                <span className={s.tick}>
                  <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                {r}
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={`${f.btn} ${f.ghost} ${s.skip}`} onClick={finish} autoFocus>
          {COPY.skip[lang]}
        </button>
        <span className={f.srOnly} role="status">{COPY.startsIn[lang]}</span>
      </div>
    </div>
  );
}

function Countdown({ phase, lang }: { phase: Phase; lang: Lang }) {
  const go = phase === "go";
  return (
    <div className={`${s.count} ${go ? s.go : ""}`}>
      <svg className={s.ring} viewBox="0 0 120 120">
        <circle className={s.ringTrack} cx="60" cy="60" r="50" />
        <circle key={String(phase)} className={s.ringArc} cx="60" cy="60" r="50" pathLength={100} />
      </svg>
      <span key={`n${phase}`} className={s.num}>{go ? COPY.go[lang] : phase}</span>
      {go && (
        <span className={s.rays}>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ transform: `rotate(${i * 45}deg)` }} />
          ))}
        </span>
      )}
      <div className={s.countBuddy}>
        <div className={go ? s.jump : s.bob}>
          <NibMascot className={f.mascot} mood={go ? "wow" : "happy"} />
        </div>
      </div>
    </div>
  );
}

/** Topic: focus target; Nibbu drops onto the bullseye. */
function TopicVisual() {
  return (
    <div className={s.topicVis}>
      <svg className={s.target} viewBox="0 0 160 60">
        <ellipse className={s.ring1} cx="80" cy="30" rx="76" ry="27" />
        <ellipse className={s.ring2} cx="80" cy="30" rx="52" ry="18.5" />
        <ellipse className={s.ring3} cx="80" cy="30" rx="27" ry="9.5" />
      </svg>
      <div className={s.dropper}>
        <div className={s.land}>
          <NibMascot className={f.mascot} />
        </div>
      </div>
    </div>
  );
}

/** Daily: streak flame flickers; this week's dots fill in. */
function DailyVisual({ days, lang }: { days: number; lang: Lang }) {
  return (
    <div className={s.dailyVis}>
      <svg className={s.flame} viewBox="0 0 70 90">
        <defs>
          <linearGradient id="ccFlame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffb547" />
            <stop offset="1" stopColor="#ff5a1f" />
          </linearGradient>
        </defs>
        <path fill="url(#ccFlame)" d="M35 4C40 22 62 30 62 56c0 18-12 30-27 30S8 74 8 56c0-14 8-22 14-30 2 10 6 14 10 14-2-12-2-24 3-36Z" />
        <path fill="#ffd34d" d="M35 40c5 12 15 16 15 26 0 10-7 16-15 16s-15-6-15-16c0-8 6-12 8-18 2 6 4 8 6 8-1-6-1-10 1-16Z" />
      </svg>
      <span className={s.streakNum}>{days}</span>
      <span className={s.streakLabel}>{COPY.dayStreak[lang]}</span>
      <div className={s.flameBuddy}>
        <NibMascot className={f.mascot} />
      </div>
    </div>
  );
}

/** Full mock: OMR sheet slides up and fills; exam clock sweeps. */
function FullVisual() {
  const rows = [1, 3, 0, 2, 1, 3, 2];
  return (
    <div className={s.fullVis}>
      <div className={s.sheet}>
        <span className={s.sheetHead} />
        {rows.map((pick, r) => (
          <span key={r} className={s.sheetRow}>
            {[0, 1, 2, 3].map((c) => (
              <i key={c} className={c === pick ? s.picked : undefined} style={c === pick ? { animationDelay: `${0.6 + r * 0.16}s` } : undefined} />
            ))}
          </span>
        ))}
      </div>
      <svg className={s.clock} viewBox="0 0 40 40">
        <circle cx="20" cy="21" r="15" className={s.clockFace} />
        <path d="M17 4h6" className={s.clockKnob} />
        <path d="M20 21V11" className={s.clockHand} />
      </svg>
      <div className={s.sheetBuddy}>
        <NibMascot className={f.mascot} mood="determined" />
      </div>
    </div>
  );
}
