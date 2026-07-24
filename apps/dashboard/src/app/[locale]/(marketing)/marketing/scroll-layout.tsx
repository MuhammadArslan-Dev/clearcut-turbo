"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Page() {
  // overall page scroll progress (0 → 1)
  const { scrollYProgress } = useScroll();
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // hero parallax
  const heroTitleY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroSubY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const heroBlobY = useTransform(scrollYProgress, [0, 0.4], [0, 120]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50">
      {/* Scroll progress bar at the top */}
      <motion.div
        className="fixed left-0 top-0 z-40 h-1 origin-left bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-400"
        style={{ scaleX: progressScaleX }}
      />

      {/* Hero section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        {/* background blobs */}
        <motion.div
          className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-sky-500/40 blur-3xl"
          style={{ y: heroBlobY }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/40 blur-3xl"
          style={{ y: heroBlobY }}
        />

        <div className="relative z-10 max-w-3xl text-center">
          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
            style={{ y: heroTitleY }}
          >
            Scroll‑driven animations
            <span className="block bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              with Framer Motion
            </span>
          </motion.h1>

          <motion.p
            className="mt-4 text-sm text-slate-300 sm:text-base"
            style={{ y: heroSubY }}
          >
            Practice parallax effects, scroll progress, and section reveals.
            All in one small landing page.
          </motion.p>

          <motion.div
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-sky-500/60 bg-slate-900/80 px-4 py-2 text-xs text-sky-100 shadow-lg backdrop-blur"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-slate-950 text-[11px]">
              ↓
            </span>
            <span>Scroll to see each section animate into view.</span>
          </motion.div>
        </div>
      </section>

      {/* Content sections */}
      <main className="space-y-24 pb-24">
        <ScrollSection
          eyebrow="01 · Parallax"
          title="Move elements based on scroll"
          body="Use useScroll and useTransform to map scroll progress into translations, opacity, or scale. Great for subtle depth and motion."
        />
        <ScrollSection
          eyebrow="02 · Reveal on view"
          title="Animate sections when they appear"
          body="Use whileInView and viewport options to trigger animations only when a component enters the viewport."
        />
        <ScrollSection
          eyebrow="03 · Progress feedback"
          title="Indicate reading progress"
          body="Combine scrollYProgress with a horizontal bar or reading indicator so users always know where they are on the page."
        />
      </main>
    </div>
  );
}

/* ==================== ScrollSection ==================== */

function ScrollSection({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Sections animate when they come into view using `whileInView`
  return (
    <section className="px-4">
      <motion.div
        ref={ref}
        className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl md:flex-row md:items-center"
        // starting state (before entering viewport)
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        // animate only when in viewport:
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }} // run once when 40% visible
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sky-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-[13px] text-slate-300">{body}</p>
        </div>

        {/* decorative card with subtle own scroll effect */}
        <ScrollDecorCard />
      </motion.div>
    </section>
  );
}

/* ==================== Decorative mini‑card ==================== */

function ScrollDecorCard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // when card enters/leaves viewport
  });

  // map local scroll progress to rotation / y
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <motion.div
      ref={ref}
      className="relative h-40 w-full max-w-xs overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-900/90 p-4 text-[11px]"
      style={{ y, rotate }}
    >
      <p className="text-[10px] text-sky-300">Scroll‑linked card</p>
      <p className="mt-1 text-slate-100">
        This mini card slightly drifts and rotates as you scroll the page,
        using scrollYProgress on just this element.
      </p>
      <motion.div
        className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-sky-500/30 blur-2xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [20, -10]) }}
      />
    </motion.div>
  );
}