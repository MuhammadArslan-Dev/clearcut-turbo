"use client";

import { ZONES, type ZoneKey } from "./zones";

/** Studio trend line ("Last 5 weeks"), shared by MeterScreen and the apps. */
export function Sparkline({ trend, zone }: { trend: number[]; zone: ZoneKey }) {
  if (!trend || trend.length < 2) return null;
  const w = 70;
  const h = 22;
  const mn = Math.min(...trend) - 2;
  const mx = Math.max(...trend) + 2;
  const pts = trend.map((v, i) => `${((i / (trend.length - 1)) * w).toFixed(1)},${(h - ((v - mn) / (mx - mn)) * h).toFixed(1)}`);
  const last = pts[pts.length - 1].split(",");
  const c = ZONES[zone].c;
  return (
    <svg width={w} height={h} viewBox={`-2 -2 ${w + 4} ${h + 4}`} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={c} />
    </svg>
  );
}
