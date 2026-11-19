"use client";

// Phase 120 (variant "airplane"): the paper plane of the OTP wait prototype (otp-waiting-prototype-v3.html), ported 1:1 for the
// parts the test covers. It rests in Nibbu's hand, Nibbu "throws" it when the OTP is sent, it arcs to the OTP boxes and circles
// above them (lighting the dots of the empty boxes as it passes, a lazier lap when the wait gets long), and it flies back to
// Nibbu when the resend countdown ends (Nibbu "catches" it). Nibbu's eyes follow it.
// Purely visual: a portalled, fixed, pointer-events:none layer (the layout never changes), it never touches the input, the buttons
// or any request. The loop only runs while something moves, is parked under reduced motion, and any problem just hides it.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./start.module.css";

type FlightState = "idle" | "launch" | "orbit" | "return";
type El = HTMLElement | null;
type Pt = { x: number; y: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

const TRAIL_MAX = 38;
const LAUNCH_DELAY_MS = 650;

export default function OtpAirplane({
  getMascot,
  getTarget,
  launchKey,
  returning,
  slow,
}: {
  getMascot: () => El;
  getTarget: () => El;
  /** Changes every time an OTP is (re)sent: the plane launches again. */
  launchKey: number;
  /** The resend countdown is over: the plane flies back to Nibbu. */
  returning: boolean;
  /** The wait is taking longer than usual: a lazier, wider lap. */
  slow: boolean;
}) {
  const planeRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const api = useRef<{ launch: () => void; goHome: () => void; cheer: () => void } | null>(null);
  const returningRef = useRef(returning);
  returningRef.current = returning;
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const getMascotRef = useRef(getMascot);
  const getTargetRef = useRef(getTarget);
  getMascotRef.current = getMascot;
  getTargetRef.current = getTarget;

  // The flight engine: one rAF loop that runs only while the plane is moving (or its trail is fading).
  useEffect(() => {
    const plane = planeRef.current;
    const canvas = canvasRef.current;
    if (!plane || !canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(plane);
    const brand = css.getPropertyValue("--color-brand").trim() || "currentColor";
    const grey = css.getPropertyValue("--color-border-gray-subtle").trim() || "currentColor";

    let state: FlightState = "idle";
    let t = 0;
    let theta = 1.5 * Math.PI;
    let age = 0;
    let boost = 0;
    let slowK = 0;
    let raf = 0;
    let last = 0;
    let dpr = 1;
    let W = 0;
    let H = 0;
    let fxTimer: ReturnType<typeof setTimeout> | null = null;
    const f = { x: -100, y: -100, a: -0.5, s: 1, sy: 1, o: 0, fx: 0, fy: 0 };
    const trail: Pt[] = [];

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    /** Nibbu's one-shot moves (prototype: `throw` on launch, `catch` on return). Written as an attribute the stylesheet reads. */
    const fx = (name: "throw" | "catch", ms: number) => {
      const el = getMascotRef.current();
      if (!el || reduced) return;
      if (fxTimer) clearTimeout(fxTimer);
      el.setAttribute("data-fx", name);
      fxTimer = setTimeout(() => el.removeAttribute("data-fx"), ms);
    };

    /** Nibbu's eyes follow the plane (the stage reads these two custom properties). */
    const lookAtPlane = (reset: boolean) => {
      const m = getMascotRef.current();
      const face = m?.querySelector<HTMLElement>("[data-mood]");
      if (!m || !face) return;
      const typing = document.activeElement instanceof HTMLInputElement && document.activeElement.value !== "";
      if (typing) return;
      if (reset) {
        face.style.setProperty("--nib-look-x", "0px");
        face.style.setProperty("--nib-look-y", "0px");
        return;
      }
      const r = m.getBoundingClientRect();
      const dx = f.x - (r.left + r.width / 2);
      const dy = f.y - (r.top + r.height * 0.4);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 160) * 1.5 * (r.width / 76);
      face.style.setProperty("--nib-look-x", `${((dx / d) * k).toFixed(1)}px`);
      face.style.setProperty("--nib-look-y", `${((dy / d) * k).toFixed(1)}px`);
    };

    const geo = () => {
      const m = getMascotRef.current()?.getBoundingClientRect();
      const o = getTargetRef.current()?.getBoundingClientRect();
      if (!m || !o || !m.width || !o.width) return null;
      // Desktop: Nibbu is big and the plane sits at its raised hand; on a phone Nibbu is a small avatar, the plane sits at its feet.
      const compact = m.width < 110;
      const hand = compact ? { x: m.left + m.width * 0.5, y: m.top + m.height * 0.92 } : { x: m.left + m.width * 0.92, y: m.top + m.height * 0.56 };
      const cx = o.left + o.width / 2;
      const rx = Math.min(80, o.width * 0.3);
      const ry = 15;
      const cy = o.top - 25;
      return { compact, hand, cx, cy, rx, ry, top: { x: cx, y: cy - ry } };
    };

    const paint = () => {
      plane.style.transform = `translate(${(f.x - 19).toFixed(1)}px,${(f.y - 19).toFixed(1)}px) rotate(${f.a.toFixed(3)}rad) scale(${f.s.toFixed(3)},${(f.s * f.sy).toFixed(3)})`;
      plane.style.opacity = String(f.o);
    };

    /** Trail + the dots of the empty OTP boxes (grey, glowing blue as the plane passes over them). */
    const drawScene = (moving: boolean) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const target = getTargetRef.current();
      if (target) {
        const active = document.activeElement;
        target.querySelectorAll<HTMLInputElement>("input").forEach((inp) => {
          if (inp.value || inp === active) return; // the prototype hides the dot on a filled or focused box
          const r = inp.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const gl = moving ? clamp(1 - Math.hypot(f.x - cx, (f.y - cy) * 0.5) / 78) : 0;
          const rad = 3.5 * (0.7 + gl * 0.8);
          ctx.globalAlpha = 0.45 + gl * 0.55;
          ctx.fillStyle = grey;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.fill();
          if (gl > 0) {
            ctx.globalAlpha = gl * (0.45 + gl * 0.55);
            ctx.fillStyle = brand;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      if (moving && !reduced) trail.push({ x: f.x, y: f.y });
      else if (trail.length) trail.shift();
      while (trail.length > TRAIL_MAX) trail.shift();
      ctx.lineCap = "round";
      ctx.strokeStyle = brand;
      for (let i = 1; i < trail.length; i++) {
        const k = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.globalAlpha = k * 0.1;
        ctx.lineWidth = 3 + k * 9;
        ctx.stroke();
        ctx.globalAlpha = k * 0.42;
        ctx.lineWidth = 1 + k * 2.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (ts: number) => {
      raf = 0;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
      last = ts;
      const g = geo();
      let moving = true;
      let tsy = 1; // target vertical squash (banking)
      if (!g) {
        f.o = 0; // a hidden mascot / OTP row: nothing to fly between
        moving = false;
      } else if (state === "idle") {
        f.x = g.hand.x;
        f.y = g.hand.y;
        f.a = g.compact ? Math.PI / 2 : -0.5;
        f.s = 1;
        f.o = 1;
        moving = false;
      } else if (state === "launch") {
        t += dt / 1.55;
        const k = clamp(t);
        const e = easeSine(k);
        const dx = g.top.x - g.hand.x;
        const p1 = { x: g.hand.x + dx * 0.12, y: g.hand.y - 100 };
        const p2 = { x: g.top.x - Math.max(120, Math.abs(dx) * 0.32), y: g.top.y };
        const p = bezier(g.hand, p1, p2, g.top, e);
        const q = bezier(g.hand, p1, p2, g.top, clamp(e + 0.02));
        f.x = p.x;
        f.y = p.y;
        f.a = Math.atan2(q.y - p.y, q.x - p.x);
        f.o = 1;
        f.s = 0.75 + 0.25 * clamp(k * 3);
        if (k >= 1) {
          state = "orbit";
          theta = 1.5 * Math.PI;
          age = 0;
        }
      } else if (state === "orbit") {
        age += dt;
        boost = Math.max(0, boost - dt);
        slowK += ((slowRef.current ? 1 : 0) - slowK) * Math.min(1, dt * 1.4); // eases into the lazy "slow network" lap
        const rx = g.rx * (1 + 0.3 * slowK);
        const ry = g.ry * (1 + 0.12 * slowK);
        const ramp = clamp(0.35 + age / 0.8);
        const w = ((2 * Math.PI) / 3.6) * ramp * (1 + boost * 1.6) * (1 - 0.2 * slowK);
        theta += w * dt;
        f.x = g.cx + rx * Math.cos(theta);
        f.y = g.cy + ry * Math.sin(theta);
        f.a = Math.atan2(ry * Math.cos(theta), -rx * Math.sin(theta));
        f.s = 1;
        f.o = 1;
        tsy = 1 - 0.34 * Math.abs(Math.cos(theta)); // banks (squashes) through the turns
      } else {
        t += dt / 1.25;
        const k = clamp(t);
        const e = easeInOut(k);
        const mid = { x: (f.fx + g.hand.x) / 2, y: Math.min(f.fy, g.hand.y) - 90 };
        const at = (s: number): Pt => {
          const u = 1 - s;
          return { x: u * u * f.fx + 2 * u * s * mid.x + s * s * g.hand.x, y: u * u * f.fy + 2 * u * s * mid.y + s * s * g.hand.y };
        };
        const p = at(e);
        const q = at(clamp(e + 0.02));
        f.x = p.x;
        f.y = p.y;
        f.a = Math.atan2(q.y - p.y, q.x - p.x);
        f.o = 1;
        if (k >= 1) {
          state = "idle";
          fx("catch", 460);
        }
      }
      f.sy += (tsy - f.sy) * Math.min(1, dt * 9);
      paint();
      drawScene(moving);
      if (g) lookAtPlane(state === "idle");
      // Loop only while there is something moving or a trail still fading.
      if (moving || trail.length) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onResize = () => {
      size();
      kick();
    };
    window.addEventListener("resize", onResize);
    // The dots follow typing/focus (a filled or focused box shows no dot).
    const target = getTargetRef.current();
    const onField = () => kick();
    target?.addEventListener("input", onField);
    target?.addEventListener("focusin", onField);
    target?.addEventListener("focusout", onField);

    api.current = {
      launch: () => {
        state = reduced ? "idle" : "launch";
        t = 0;
        slowK = 0;
        if (state === "launch") fx("throw", 520);
        kick();
      },
      goHome: () => {
        if (state === "orbit" || state === "launch") {
          state = "return";
          t = 0;
          f.fx = f.x;
          f.fy = f.y;
        }
        kick();
      },
      // Tapping Nibbu while the plane is up: a quick victory lap (prototype).
      cheer: () => {
        if (state === "orbit" || state === "launch") boost = 1;
        kick();
      },
    };
    state = "idle";
    kick();

    const mascotEl = getMascotRef.current();
    const onTap = () => api.current?.cheer();
    mascotEl?.addEventListener("click", onTap);

    // A hidden tab pauses rAF by itself; on return, one frame re-aligns the plane (the layout may have moved).
    const onVisible = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      api.current = null;
      if (raf) cancelAnimationFrame(raf);
      if (fxTimer) clearTimeout(fxTimer);
      mascotEl?.removeAttribute("data-fx");
      mascotEl?.removeEventListener("click", onTap);
      const face = mascotEl?.querySelector<HTMLElement>("[data-mood]");
      face?.style.setProperty("--nib-look-x", "0px");
      face?.style.setProperty("--nib-look-y", "0px");
      target?.removeEventListener("input", onField);
      target?.removeEventListener("focusin", onField);
      target?.removeEventListener("focusout", onField);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // OTP sent / re-sent: launch after a short beat (unless the countdown is already over).
  useEffect(() => {
    const id = setTimeout(() => {
      if (!returningRef.current) api.current?.launch();
    }, LAUNCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [launchKey]);

  // Countdown over: fly home.
  useEffect(() => {
    if (returning) api.current?.goHome();
  }, [returning]);

  // Portalled to <body>: an ancestor with a transform/animation would otherwise become the containing block of `position: fixed`
  // and shift the plane by the panel's offset (seen on /start: the plane flew off-screen).
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.flight} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.flightCanvas} />
      <div ref={planeRef} className={styles.plane}>
        <svg viewBox="0 0 40 40" width="100%" height="100%" focusable="false">
          <defs>
            <linearGradient id="otpPlaneA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className={styles.planeStopA0} />
              <stop offset="1" className={styles.planeStopA1} />
            </linearGradient>
            <linearGradient id="otpPlaneB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className={styles.planeStopB0} />
              <stop offset="1" className={styles.planeStopB1} />
            </linearGradient>
          </defs>
          <path d="M2 9 L38 19 L13 22 Z" fill="url(#otpPlaneA)" />
          <path d="M13 22 L38 19 L17 32 Z" fill="url(#otpPlaneB)" />
          <path d="M13 22 L2 9 L15 17.5 Z" className={styles.planeC} />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
