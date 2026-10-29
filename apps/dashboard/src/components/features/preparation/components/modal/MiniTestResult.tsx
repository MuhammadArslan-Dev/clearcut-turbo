"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ChevronRight, FileText, RefreshCw } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useMiniTestStore } from "../../store/useMiniTestStore";

import { CrossIcon } from "@/components/ui/icons";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useTranslations } from "next-intl";

/* -------------------------------------------------------------------------- */
/*                             ANIMATION CONFIGS                              */
/* -------------------------------------------------------------------------- */

// Badge: pops in past full size, settles with a small bounce and a slight turn.
const badgePop = {
  initial: { scale: 0, rotate: -14, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  transition: {
    type: "spring" as const,
    stiffness: 320,
    damping: 11,
    mass: 0.8,
    delay: 0.12,
  },
};

// Offsets (px) from the badge centre, taken from the design. Fixed on purpose:
// random values would give a different layout on every render.
const CONFETTI = [
  { x: -68, y: -36, kind: "dash", color: "yellow", rotate: -50 },
  { x: -88, y: -14, kind: "dash", color: "green", rotate: 35 },
  { x: -100, y: 24, kind: "square", color: "yellow", rotate: 40 },
  { x: -62, y: 28, kind: "square", color: "blue", rotate: 15 },
  { x: 56, y: -54, kind: "dash", color: "yellow", rotate: 35 },
  { x: 84, y: -34, kind: "dash", color: "blue", rotate: -35 },
  { x: 66, y: 6, kind: "dash", color: "yellow", rotate: 40 },
  { x: 100, y: 24, kind: "square", color: "green", rotate: 20 },
] as const;

const CONFETTI_COLOR = {
  yellow: "var(--color-highlight-yellow-border)",
  green: "var(--color-success)",
  blue: "var(--color-brand)",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function MiniTestResult() {
  const isMobile = useIsMobile();

  const { isOpen, closeModal, stack, open } = usePreparationModalStore();
  const active = stack[stack.length - 1];

  const { getResult } = useMiniTestStore();
  const result = getResult();

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const visible = isOpen && active === "mini-test-result";

  return (
    <AnimatePresence>
      {visible && (
        <Container
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          isOpen={isOpen}
          maxWidth="md:max-w-[608px]"
          onClose={() => closeModal("mini-test-result")}
        >
          <ResultCard
            result={result}
            close={() => closeModal("mini-test-result")}
            restart={() => open("mini-test")}
          />
        </Container>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   CARD                                     */
/* -------------------------------------------------------------------------- */

function ResultCard({
  result,
  close,
  restart,
}: {
  result: { correct: number; total: number };
  close: () => void;
  restart: () => void;
}) {
  const trans = useTranslations("modals.miniTestResult");
  const reduce = useReducedMotion();

  /* ----------------------- smooth score animation ------------------------ */

  const scoreValue = useMotionValue(reduce ? result.correct : 0);
  const smoothScore = useSpring(scoreValue, { stiffness: 120, damping: 18 });
  const barWidth = useTransform(smoothScore, (v) =>
    result.total > 0 ? `${Math.min(100, (v / result.total) * 100)}%` : "0%",
  );

  const [displayScore, setDisplayScore] = useState(reduce ? result.correct : 0);

  useMotionValueEvent(smoothScore, "change", (latest) => {
    setDisplayScore(Math.round(latest));
  });

  useEffect(() => {
    if (reduce) {
      scoreValue.jump(result.correct);
      smoothScore.jump(result.correct);
      return;
    }
    scoreValue.set(result.correct);
  }, [reduce, result.correct, scoreValue, smoothScore]);

  /* ------------------------------ copy tier ------------------------------- */

  // Tier is decided by the final score, not the counting-up number, so the
  // headline does not flip while the score animates.
  const delta = result.total - result.correct;
  const tier =
    delta === 0
      ? "perfect"
      : delta === 1
        ? "almostPerfect"
        : delta === 2
          ? "goodProgress"
          : "needsPractice";

  return (
    <div
      role="group"
      aria-labelledby="mini-test-result-title"
      className="relative overflow-hidden bg-white"
    >
      <Backdrop />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand sm:h-[38px] sm:w-[38px]"
            style={{ background: "var(--color-primary-bg-soft)" }}
            aria-hidden="true"
          >
            <FileText size={20} strokeWidth={2} />
          </span>
          <p className="heading-medium !font-bold text-surface-gray-normal">
            {trans("title")}
          </p>
        </div>

        <button
          type="button"
          onClick={close}
          className="-mr-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-surface-gray-normal hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
          aria-label={trans("closeLabel")}
        >
          <CrossIcon size={26} color="currentColor" />
        </button>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-2 text-center sm:px-6">
        <Badge reduce={!!reduce} />

        <h2
          id="mini-test-result-title"
          className="mt-1 heading-xlarge !font-extrabold text-surface-gray-normal"
        >
          {trans(`messages.${tier}.title`)}
        </h2>
        <p className="mt-1 body-large text-surface-gray-muted">
          {trans(`messages.${tier}.subtitle`)}
        </p>
      </div>

      {/* Score + side illustrations */}
      <div className="relative z-10 mt-5 flex justify-center px-5 sm:px-6">
        <SideArt
          src="/images/topic-test-checklist.webp"
          className="left-3 bottom-0 w-[142px] -translate-y-3"
          reduce={!!reduce}
          from={-24}
        />
        <SideArt
          src="/images/topic-test-books.webp"
          className="right-3 bottom-2 w-[132px]"
          reduce={!!reduce}
          from={24}
        />

        <div
          className="w-[190px] rounded-[20px] border px-5 pb-4 pt-3 text-center"
          style={{
            background: "var(--color-primary-bg-soft)",
            borderColor: "var(--color-primary-bg-soft)",
          }}
        >
          <p className="body-large text-surface-gray-muted">
            {trans("scoreLabel")}
          </p>

          <p
            className="heading-xlarge !text-[44px] !leading-tight !font-extrabold text-surface-gray-normal"
            aria-label={`${result.correct} / ${result.total}`}
          >
            <span className="text-brand">{displayScore}</span>
            <span className="mx-1 font-medium text-surface-gray-muted">/</span>
            <span>{result.total}</span>
          </p>

          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={result.total}
            aria-valuenow={result.correct}
          >
            <motion.div
              className="h-full rounded-full bg-brand"
              style={{ width: barWidth }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex justify-center px-5 pb-6 pt-6 sm:px-6 sm:pb-7">
        <div className="flex w-full max-w-[421px] flex-col gap-2.5">
          <Button
            onClick={close}
            size="lg"
            sx={{ borderRadius: "50px" }}
            color="primary"
            fullWidth
          >
            <span className="flex items-center justify-center gap-1.5">
              <span>{trans("buttons.continueLearning")}</span>
              <ChevronRight size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
          </Button>

          <Button
            onClick={restart}
            size="lg"
            sx={{ borderRadius: "50px" }}
            variant="outlined"
            color="gray"
            className="!border-[var(--color-primary-bg-soft)] !bg-white/70"
            fullWidth
          >
            <span className="flex items-center justify-center gap-2">
              <span className="!font-bold">{trans("buttons.improveScore")}</span>
              <RefreshCw size={18} strokeWidth={2.25} aria-hidden="true" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         BADGE + CONFETTI + BACKDROP                        */
/* -------------------------------------------------------------------------- */

const Badge = React.memo(function Badge({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative flex h-[132px] w-[220px] items-center justify-center sm:h-[140px]">
      {/* halo */}
      <motion.span
        aria-hidden="true"
        className="absolute h-[120px] w-[120px] rounded-full"
        style={{ background: "var(--color-primary-bg-soft)" }}
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* confetti: transform + opacity only */}
      {CONFETTI.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: p.kind === "dash" ? 5 : 9,
            height: p.kind === "dash" ? 15 : 9,
            marginLeft: p.kind === "dash" ? -2.5 : -4.5,
            marginTop: p.kind === "dash" ? -7.5 : -4.5,
            borderRadius: p.kind === "dash" ? 3 : 2,
            background: CONFETTI_COLOR[p.color],
            rotate: p.rotate,
          }}
          initial={reduce ? false : { x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 14,
            delay: 0.28 + i * 0.03,
          }}
        />
      ))}

      <motion.div
        className="relative"
        {...(reduce ? {} : badgePop)}
        style={{ willChange: "transform" }}
      >
        <Image
          src="/images/topic-test-badge.webp"
          alt=""
          width={120}
          height={120}
          priority
          draggable={false}
          className="select-none"
        />
      </motion.div>
    </div>
  );
});

function SideArt({
  src,
  className,
  reduce,
  from,
}: {
  src: string;
  className: string;
  reduce: boolean;
  from: number;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden sm:block ${className}`}
      initial={reduce ? false : { opacity: 0, x: from }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
    >
      <Image src={src} alt="" width={300} height={300} draggable={false} />
    </motion.div>
  );
}

/** Soft blue-white blobs behind the card; built from the brand tint token. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute -right-24 -top-28 h-[300px] w-[300px] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-primary-bg-soft), transparent)",
        }}
      />
      <div
        className="absolute -bottom-24 -left-20 h-[280px] w-[340px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-primary-bg-soft), transparent)",
        }}
      />
      <div
        className="absolute -bottom-28 -right-16 h-[260px] w-[320px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-primary-bg-soft), transparent)",
        }}
      />
    </div>
  );
}
