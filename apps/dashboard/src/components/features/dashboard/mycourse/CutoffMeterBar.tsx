"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@clearcut/motion/core";
import { ZONES, segments, zoneOf, type ZoneKey } from "@clearcut/motion/meters/zones";

/**
 * The Cutoff Meter Studio "bar" meter, 1:1 (phase 98): an 18px track split
 * into the four zone tints (need / almost / clear / safe, relative to the
 * student's pass mark), a translucent confidence band around the score, the
 * zone-coloured fill, the dark pass-mark tick (±8px) and a rider (Nibbu)
 * 30px above the fill's end. Fill, band and rider share the studio spring
 * (1150 ms, cubic-bezier(.34,1.56,.64,1)) after a 250 ms delay.
 * Colours come from `@clearcut/motion/meters/zones` (approved artwork).
 */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const TRACK = 18;
const RIDER = 28;

export function CutoffMeterBar({
  value,
  max,
  pass,
  band,
  zone,
  locked,
  rider,
  ariaLabel,
}: {
  value: number;
  max: number;
  pass: number;
  /** confidence band, ± marks (studio: 15 early … 4 settled) */
  band: number;
  zone: ZoneKey;
  locked: boolean;
  rider?: ReactNode;
  ariaLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    if (reduced) {
      setGrown(true);
      return;
    }
    const t = setTimeout(() => setGrown(true), 250);
    return () => clearTimeout(t);
  }, [reduced]);

  const safeMax = max > 0 ? max : 1;
  const clampPct = (v: number) => Math.min(Math.max((v / safeMax) * 100, 0), 100);
  const v = locked ? 0 : value;
  const pct = grown ? clampPct(v) : 0;
  const lo = Math.max(0, v - band);
  const hi = Math.min(safeMax, v + band);
  const bandZone = ZONES[zoneOf(v, { max: safeMax, cutoff: pass })];
  const scale = { max: safeMax, cutoff: pass };
  const move = (prop: string, ms = 1150) => (reduced ? undefined : `${prop} ${ms}ms ${SPRING}`);

  return (
    <div
      className="relative w-full rounded-full"
      style={{ height: TRACK, background: ZONES.locked.s }}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={locked ? undefined : Math.round(value)}
    >
      {segments(scale).map(([a, b, z]) => {
        const left = clampPct(a);
        const width = clampPct(b) - left;
        if (width <= 0) return null;
        return (
          <i
            key={z}
            aria-hidden="true"
            className="absolute top-0 bottom-0"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              background: locked ? ZONES.locked.s : ZONES[z].s,
              borderRadius: a <= 0 ? "99px 0 0 99px" : b >= safeMax ? "0 99px 99px 0" : undefined,
            }}
          />
        );
      })}
      {!locked && band > 0 && (
        <i
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            top: -5,
            bottom: -5,
            left: `${grown ? clampPct(lo) : 0}%`,
            width: `${grown ? clampPct(hi) - clampPct(lo) : 0}%`,
            background: bandZone.c,
            opacity: 0.16,
            transition: reduced ? undefined : "left 600ms, width 600ms",
          }}
        />
      )}
      {!locked && (
        <i
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: ZONES[zone].c,
            transition: reduced ? undefined : `width 1150ms ${SPRING}, background 400ms`,
          }}
        />
      )}
      <i
        aria-hidden="true"
        className="absolute rounded-[2px]"
        style={{ top: -8, bottom: -8, width: 3, left: `calc(${clampPct(pass)}% - 1.5px)`, background: "var(--color-surface-gray-normal)" }}
      />
      {!locked && rider && (
        <span
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: -30,
            width: RIDER,
            marginLeft: -RIDER / 2,
            // studio: left = pct; clamped so Nibbu never pokes out of the card
            left: `clamp(${RIDER / 2}px, ${pct}%, calc(100% - ${RIDER / 2}px))`,
            transition: move("left"),
          }}
        >
          {rider}
        </span>
      )}
    </div>
  );
}
