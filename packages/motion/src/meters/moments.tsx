"use client";

import type { ReactNode } from "react";
import type { NibAccessory, NibMood } from "../nibbu";
import type { MeterHandle } from "./Meter";
import type { FxApi } from "./effects";
import type { MeterVariant } from "./zones";

export interface MomentCtx {
  m: MeterHandle;
  fx: FxApi;
  /** swap the corner Nibbu (pop = replay the pop-in) */
  nib(mood: NibMood, accessory?: NibAccessory, pop?: boolean): void;
  label(text: string): void;
  wait(ms: number): Promise<void>;
  variant: MeterVariant;
}

export interface MeterMoment {
  id: "unlock" | "sweep" | "tick" | "rise" | "cross" | "drop" | "cool" | "narrow";
  t: string;
  trig: string;
  tim: string;
  p: string;
  run(c: MomentCtx): Promise<void>;
}

const b = (lead: string, rest: string): ReactNode => (
  <>
    <b>{lead}</b> {rest}
  </>
);

/** The studio's 8 animation moments, with their triggers and timings (copy as designed, English). */
export const MOMENTS: MeterMoment[] = [
  {
    id: "unlock",
    t: "Unlock",
    trig: "First test submitted",
    tim: "Lock 650 ms → sweep 1150 ms",
    p: "Lock shakes, breaks upward, the track fills with colour and the needle sweeps to the first estimate with a wide range.",
    async run({ m, nib, wait }) {
      m.lock(true);
      await wait(700);
      await m.unlock();
      nib("wow", "none", true);
      await m.set(72, { band: 15 });
    },
  },
  {
    id: "sweep",
    t: "Open the meter",
    trig: "Screen opens",
    tim: "1150 ms spring, count-up in sync",
    p: "Needle sweeps from 0 with a small overshoot. The number counts up at the same speed, then the zone pill settles.",
    async run({ m, nib, wait }) {
      nib("determined", "none");
      await wait(300);
      await m.set(82, { band: 6 });
    },
  },
  {
    id: "tick",
    t: "Live tick",
    trig: "Each correct answer during practice",
    tim: "Chip 1600 ms, needle 600 ms",
    p: "Small ‘+0.4’ chips float up and the needle nudges. Subtle on purpose: it says every question counts without distracting.",
    async run({ m, wait }) {
      void m.set(82, { dur: 1, band: 6 });
      let v = 82;
      await wait(500);
      for (let i = 0; i < 3; i++) {
        v = +(v + 0.4).toFixed(1);
        m.delta(0.4, true);
        await m.set(v, { dur: 600, dec: 1 });
        await wait(500);
      }
    },
  },
  {
    id: "rise",
    t: "Score goes up",
    trig: "Test submitted, score up ≥ 1",
    tim: "Chip + needle 1150 ms, toast at 600 ms",
    p: "Green delta chip, needle springs forward, then a toast names what worked so the student repeats it.",
    async run({ m, fx, nib, wait }) {
      void m.set(82, { dur: 1, band: 6 });
      const t = fx.toast(b("What worked:", "Reasoning test 8/10"));
      await wait(500);
      m.delta(6);
      nib("happy", "none", true);
      const p = m.set(88, { band: 6 });
      void wait(600).then(() => t.on());
      await p;
      await wait(1400);
      t.off();
      await wait(400);
      t.remove();
    },
  },
  {
    id: "cross",
    t: "Crossing the cutoff",
    trig: "First time predicted ≥ cutoff",
    tim: "Burst at line, confetti 1300 ms, stamp 600 ms",
    p: "The big moment. As the needle passes the cutoff line: burst ring, confetti, ‘Cleared ✓’ stamp, and Nibbu’s cap drops on.",
    async run({ m, fx, nib, wait, variant }) {
      void m.set(86, { dur: 1, band: 5 });
      nib("determined", "none");
      await wait(500);
      void m.set(94, { band: 5 });
      await wait(450);
      fx.burst(variant === "gauge" ? "62%" : "64%", variant === "gauge" ? "22%" : "52%");
      fx.confetti();
      const removeStamp = fx.stamp("Cleared ✓");
      nib("happy", "cap", true);
      await wait(2000);
      removeStamp();
    },
  },
  {
    id: "drop",
    t: "Score drops",
    trig: "Test submitted, score down ≥ 3",
    tim: "Ease-down 900 ms, 1 wobble",
    p: "No spring, no red flash. Needle eases down, one gentle wobble, then a ‘win it back’ toast with the cause.",
    async run({ m, fx, nib, wait }) {
      void m.set(88, { dur: 1, band: 6 });
      const t = fx.toast(b("Mock 4:", "8 of 12 misses were percentages → Fix it"));
      await wait(500);
      m.delta(-7);
      nib("determined", "headband", true);
      const p = m.set(81, { band: 6, dur: 900 });
      void wait(700).then(() => {
        m.wobble();
        t.on();
      });
      await p;
      await wait(1600);
      t.off();
    },
  },
  {
    id: "cool",
    t: "Cooling & warm-up",
    trig: "3+ days inactive, then next test",
    tim: "Desaturate 1400 ms · warm 900 ms",
    p: "Colours drain and the score eases down 3. On the next test the colour comes back with a ‘+3 restored’ chip.",
    async run({ m, nib, wait }) {
      m.cool(false);
      void m.set(86, { dur: 1, band: 7 });
      nib("happy", "none");
      await wait(500);
      m.cool(true);
      nib("sleepy", "zzz", true);
      await m.set(83, { dur: 1400 });
      await wait(1200);
      m.cool(false);
      m.delta(3);
      nib("happy", "none", true);
      await m.set(86, { dur: 900 });
    },
  },
  {
    id: "narrow",
    t: "Range tightens",
    trig: "More tests submitted",
    tim: "Band 600 ms per step",
    p: "The shaded range around the needle shrinks as the student takes more tests: ±15 → ±10 → ±6 → ±4. Builds trust in the number.",
    async run({ m, label, wait }) {
      void m.set(80, { dur: 1, band: 15 });
      const steps: [number, string][] = [
        [15, "1 test"],
        [10, "3 tests"],
        [6, "7 tests"],
        [4, "15 tests"],
      ];
      await wait(300);
      for (const [band, txt] of steps) {
        m.setBand(band);
        label(`±${band} · ${txt}`);
        await wait(900);
      }
    },
  },
];
