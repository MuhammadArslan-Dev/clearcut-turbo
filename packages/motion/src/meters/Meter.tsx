"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePrefersReducedMotion } from "../core";
import { Nib } from "./Nib";
import styles from "./meters.module.css";
import {
  fillShare,
  fillTiming,
  DEFAULT_SCALE,
  EARLY_BAND,
  EARLY_ESTIMATE,
  CY,
  R,
  ZONES,
  arc,
  pt,
  riderPose,
  segments,
  tr,
  zoneOf,
  type Lang,
  type MeterScale,
  type MeterSize,
  type MeterVariant,
  type ZoneKey,
} from "./zones";

/** Slow-motion factor: 1 = normal, 2 = the studio's "Slow motion 0.5×". Scales every duration. */
export const MeterMotionContext = createContext<{ k: number }>({ k: 1 });
export const useMeterK = () => useContext(MeterMotionContext).k;

export interface MeterSetOptions {
  /** count-up duration in ms (default 1150, the needle spring); 1 = jump */
  dur?: number;
  /** confidence band ± marks */
  band?: number;
  /** decimals shown while counting (live tick uses 1) */
  dec?: number;
}

/** Imperative API — the same verbs as the studio's Meter, for timed sequences. */
export interface MeterHandle {
  set(v: number, o?: MeterSetOptions): Promise<void>;
  setBand(b: number): void;
  lock(on: boolean): void;
  unlock(): Promise<void>;
  cool(on: boolean): void;
  delta(d: number, tiny?: boolean): void;
  wobble(): void;
}

export interface MeterProps {
  variant?: MeterVariant;
  size?: MeterSize;
  lang?: Lang;
  scale?: MeterScale;
  /** start locked (lock icon, "?") */
  locked?: boolean;
  /** show this value straight away (needle springs from 0) */
  value?: number;
  band?: number;
  cooling?: boolean;
  className?: string;
  /** App overrides (all optional; the studio leaves them unset): hide the zone pill under the gauge, */
  hidePill?: boolean;
  /** replace "predicted marks / max" under the number (e.g. a translated "of 150 predicted"), */
  caption?: string;
  /** replace the "Cutoff 90" label at the gauge / bar tick (e.g. a translated / shortened one). */
  cutoffLabel?: string;
  /** replace the zone pill (text + colours), e.g. translated or an app-specific state. */
  pill?: { text: string; background: string; color: string };
  /** replace the "❄ Cooling" chip text. */
  coolLabel?: string;
  /** full width of the parent instead of the studio's fixed width (bar 300px, gauge 270/170px). */
  fluid?: boolean;
  /** don't render the floating "❄ Cooling" chip (the app shows cooling in its own pill). */
  hideCoolChip?: boolean;
}

const LOCK_SVG = (
  <svg viewBox="0 0 46 52" aria-hidden="true">
    <path d="M12 22v-7a11 11 0 0 1 22 0v7" fill="none" stroke="#8597aa" strokeWidth="5" strokeLinecap="round" />
    <rect x="4" y="21" width="38" height="29" rx="8" fill="#8597aa" />
    <circle cx="23" cy="34" r="4" fill="#fff" />
    <path d="M23 36v6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

let deltaSeq = 0;

export const Meter = forwardRef<MeterHandle, MeterProps>(function Meter(
  { variant = "gauge", size = "lg", lang = "en", scale = DEFAULT_SCALE, locked: lockedProp = false, value, band: bandProp, cooling: coolingProp = false, className, hidePill = false, caption, cutoffLabel, pill: pillProp, coolLabel, fluid = false, hideCoolChip = false },
  ref,
) {
  const k = useMeterK();
  const reduced = usePrefersReducedMotion();
  const { max, cutoff } = scale;

  const [v, setV] = useState(0);
  const [numText, setNumText] = useState("0");
  const [band, setBandState] = useState(0);
  const [zone, setZone] = useState<ZoneKey>("locked");
  const [locked, setLocked] = useState(lockedProp);
  const [lockBreaking, setLockBreaking] = useState(false);
  const [cooling, setCooling] = useState(coolingProp);
  const [deltas, setDeltas] = useState<{ id: number; d: number; tiny: boolean }[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const shown = useRef(0);
  const vRef = useRef(0);
  const bandRef = useRef(0);
  const raf = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const kRef = useRef(k);
  kRef.current = k;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const applyBand = useCallback(
    (b: number) => {
      bandRef.current = b;
      setBandState(b);
      if (vRef.current || shown.current) setZone(zoneOf(vRef.current, scale));
    },
    [scale],
  );

  const handle = useMemo<MeterHandle>(
    () => ({
      set(target, o = {}) {
        const from = shown.current;
        vRef.current = target;
        setV(target);
        applyBand(o.band != null ? o.band : bandRef.current);
        setZone(zoneOf(target, scale));
        const dur = (o.dur ?? 1150) * kRef.current;
        const dec = o.dec ?? 0;
        cancelAnimationFrame(raf.current);
        return new Promise<void>((res) => {
          if (reducedRef.current) {
            shown.current = target;
            setNumText(target.toFixed(dec));
            res();
            return;
          }
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            const val = from + (target - from) * e;
            shown.current = val;
            setNumText(val.toFixed(dec));
            if (p < 1) raf.current = requestAnimationFrame(step);
            else {
              shown.current = target;
              setNumText(target.toFixed(dec));
              res();
            }
          };
          raf.current = requestAnimationFrame(step);
        });
      },
      setBand: applyBand,
      lock(on) {
        setLocked(on);
        setLockBreaking(false);
        if (on) {
          setNumText("?");
          setZone("locked");
        }
      },
      unlock() {
        setLockBreaking(true);
        return new Promise<void>((res) =>
          later(() => {
            setLockBreaking(false);
            setLocked(false);
            setNumText("0");
            res();
          }, 650 * kRef.current),
        );
      },
      cool(on) {
        setCooling(on);
      },
      delta(d, tiny = false) {
        const id = ++deltaSeq;
        setDeltas((ds) => [...ds, { id, d, tiny }]);
        later(() => setDeltas((ds) => ds.filter((x) => x.id !== id)), 1700 * kRef.current);
      },
      wobble() {
        // same as the studio: remove, force a reflow, re-add (replays the keyframes
        // without remounting, so running needle/fill transitions are not reset)
        const el = rootRef.current;
        if (!el) return;
        el.classList.remove(styles.wobble);
        void el.offsetWidth;
        el.classList.add(styles.wobble);
      },
    }),
    [applyBand, later, scale],
  );

  useImperativeHandle(ref, () => handle, [handle]);

  // Declarative start: locked shows "?", a value springs in from 0.
  const applied = useRef<{ locked: boolean; value: number | null | undefined; band: number }>({
    locked: lockedProp,
    value,
    band: bandProp ?? 0,
  });
  useEffect(() => {
    if (lockedProp) handle.lock(true);
    else if (value != null) void handle.set(value, { band: bandProp ?? 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live props (a refetch after a test submit): the meter used to read them on mount
  // only, so a page showing cached data never moved to the new score until a reload.
  useEffect(() => {
    const prev = applied.current;
    const band = bandProp ?? 0;
    if (prev.locked === lockedProp && prev.value === value && prev.band === band) return;
    applied.current = { locked: lockedProp, value, band };
    if (lockedProp) {
      handle.lock(true);
      return;
    }
    if (value == null) return;
    if (prev.locked) {
      // The test that unlocked it: break the lock, then spring to the score.
      void handle.unlock().then(() => handle.set(value, { band }));
      return;
    }
    if (prev.value !== value) void handle.set(value, { band });
    else handle.setBand(band);
  }, [lockedProp, value, bandProp, handle]);

  useEffect(() => {
    setCooling(coolingProp);
  }, [coolingProp]);

  /* ---------- derived view ---------- */
  const zoneObj = ZONES[zone];
  const early = zone !== "locked" && band >= EARLY_BAND;
  const pill = pillProp ?? {
    text: early ? tr(EARLY_ESTIMATE.lab, lang) : tr(zoneObj.lab, lang),
    background: early ? EARLY_ESTIMATE.s : zoneObj.s,
    color: early ? EARLY_ESTIMATE.ink : zoneObj.ink,
  };
  const pct = (v / max) * 100;
  const bandZone = ZONES[zoneOf(v, scale)];
  const lo = Math.max(0, v - band);
  const hi = Math.min(max - 0.01, v + band);
  const segs = segments(scale);
  // Each range: light shade on the track, its full colour only up to the score.
  const fillMs = 1150 * k;
  const segFill = (a: number, b: number) => {
    const share = locked ? 0 : fillShare(a, b, v);
    const { delay, duration } = fillTiming(a, b, v, fillMs);
    const easing = v <= b ? "cubic-bezier(.22, 1, .36, 1)" : "linear"; // ease out on the range the score lands in
    return { share, delay, duration, easing };
  };
  const cutLabel = cutoffLabel ?? `${tr({ en: "Cutoff ", hi: "कटऑफ़ " }, lang)}${cutoff}`;
  const coolText = coolLabel ?? `❄ ${tr({ en: "Cooling", hi: "ठंडा पड़ रहा" }, lang)}`;
  const lockEl = (locked || lockBreaking) && <span className={[styles.lock, lockBreaking && styles.break].filter(Boolean).join(" ")}>{LOCK_SVG}</span>;

  const rootCls = [styles.scope, styles.meter, locked && styles.locked, cooling && styles.cooling, className]
    .filter(Boolean)
    .join(" ");

  let body;
  if (variant === "gauge") {
    const tA = pt(cutoff, R - 22, max).split(" ");
    const tB = pt(cutoff, R + 14, max).split(" ");
    // "Cutoff 90" sits INSIDE the gauge, directly beneath the tick (client, 2026-11-14), not above / outside it.
    const tL = pt(cutoff, R - 38, max).split(" ");
    const [gMood, gAcc] = riderPose(zone);
    const ang = (v / max) * 180 - 90;
    body = (
      <>
        <div className={[styles.gauge, size === "sm" && styles.sm].filter(Boolean).join(" ")} style={fluid ? { width: "100%" } : undefined}>
          <svg viewBox="0 -6 240 150">
            <path
              className={styles.band}
              d={band ? arc(lo, hi, R, max) : ""}
              style={{ stroke: bandZone.c, opacity: band ? undefined : 0 }}
            />
            {segs.map(([a, b, z]) => (
              <path
                key={z}
                className={styles.seg0}
                d={arc(a + (a ? 0.6 : 0), b - (b < max ? 0.6 : 0.01), R, max)}
                stroke={ZONES[z].t}
              />
            ))}
            {segs.map(([a, b, z]) => {
              const f = segFill(a, b);
              return (
                <path
                  key={`fill-${z}`}
                  className={styles.seg0}
                  d={arc(a + (a ? 0.6 : 0), b - (b < max ? 0.6 : 0.01), R, max)}
                  pathLength={100}
                  strokeDasharray="100 200"
                  stroke={ZONES[z].c}
                  style={{
                    strokeDashoffset: 100 - f.share * 100,
                    opacity: f.share > 0 ? 1 : 0,
                    transition: `stroke-dashoffset ${f.duration}ms ${f.easing} ${f.delay}ms, opacity .2s ${f.share > 0 ? f.delay : 0}ms`,
                  }}
                />
              );
            })}
            <line className={styles.ctick} x1={tA[0]} y1={tA[1]} x2={tB[0]} y2={tB[1]} />
            <text className={styles.clab} x={tL[0]} y={+tL[1] + 3.5} textAnchor="middle">
              {cutLabel}
            </text>
            <g className={styles.ptr} style={{ transform: `rotate(${(v / max) * 180 - 90}deg)` }}>
              <polygon points="120,44 113.5,57 126.5,57" fill="#192839" />
              {/* The mascot rides the end of the filled arc like it rides the bar; it turns with the needle's
                  rotation and is counter-rotated by the same amount, so it always stands upright. */}
              <foreignObject x="104" y={CY - R - 24} width="32" height="44" style={{ overflow: "visible" }}>
                <div className={styles.gnib} style={{ transform: `rotate(${-ang}deg)` }}>
                  <Nib mood={gMood} accessory={gAcc} key={`g-${gMood}-${gAcc}`} />
                </div>
              </foreignObject>
            </g>
          </svg>
          <div className={styles.gnum}>
            <b>{numText}</b>
            <span>
              {caption ?? (
                <>
                  {tr({ en: "predicted marks / ", hi: "अनुमानित अंक / " }, lang)}
                  {max}
                </>
              )}
            </span>
          </div>
          {lockEl}
        </div>
        {!hidePill && (
          <div className={styles.zwrap}>
            <span className={styles.zpill} style={{ background: pill.background, color: pill.color }}>
              {pill.text}
            </span>
          </div>
        )}
      </>
    );
  } else {
    const [mood, acc] = riderPose(zone);
    body = (
      <div className={[styles.barm, size === "sm" && styles.sm].filter(Boolean).join(" ")} style={fluid ? { width: "100%" } : undefined}>
        <div className={styles.bartop}>
          <div className={styles.num}>
            <b>{numText}</b>
            <span>/ {max}</span>
          </div>
          <span className={styles.zpill} style={{ background: pill.background, color: pill.color }}>
            {pill.text}
          </span>
        </div>
        <div className={styles.track}>
          {segs.map(([a, b, z]) => {
            const f = segFill(a, b);
            const radius = a === 0 ? "99px 0 0 99px" : b === max ? "0 99px 99px 0" : undefined;
            return (
              <i
                key={z}
                className={styles.z}
                style={{ left: `${(a / max) * 100}%`, width: `${((b - a) / max) * 100}%`, background: ZONES[z].t, borderRadius: radius, overflow: "hidden" }}
              >
                <i
                  style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, display: "block",
                    width: `${f.share * 100}%`, background: ZONES[z].c, borderRadius: radius,
                    transition: `width ${f.duration}ms ${f.easing} ${f.delay}ms`,
                  }}
                />
              </i>
            );
          })}
          <i
            className={styles.bandb}
            style={band ? { left: `${(lo / max) * 100}%`, width: `${((hi - lo) / max) * 100}%`, background: bandZone.c } : { opacity: 0 }}
          />
          <i className={styles.cmark} style={{ left: `${(cutoff / max) * 100}%` }}>
            <span>{cutLabel}</span>
          </i>
          {/* The mascot rides the end of the fill (kept: only the gauge's white knob was to go). */}
          <div className={styles.rider} style={{ left: `${pct}%` }}>
            <Nib mood={mood} accessory={acc} key={`${mood}-${acc}`} />
          </div>
          {lockEl}
        </div>
        <div className={styles.scale}>
          <span>0</span>
          <span>{tr({ en: "predicted marks", hi: "अनुमानित अंक" }, lang)}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={rootCls} style={{ "--k": k } as CSSProperties}>
      {body}
      {!hideCoolChip && <span className={styles.coolchip} aria-hidden={!cooling}>{coolText}</span>}
      {deltas.map(({ id, d, tiny }) => (
        <span key={id} className={[styles.delta, d >= 0 ? styles.up : styles.dn, tiny && styles.tiny].filter(Boolean).join(" ")}>
          {d >= 0 ? "+" : "−"}
          {Math.abs(d)}
        </span>
      ))}
    </div>
  );
});
