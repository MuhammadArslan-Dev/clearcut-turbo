"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const totalSteps = 3;

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 140, damping: 16 },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { duration: 0.18 },
  },
};

export default function Page() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [optional, setOptional] = useState("");

  const progress = ((step + 1) / totalSteps) * 100;

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">
      <AnimatedBackground />

      <motion.div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 px-6 py-7 text-slate-50 shadow-2xl backdrop-blur-xl"

        variants={
          {
            initial: { opacity: 0, y: 24, scale: 0.96 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: -24, scale: 0.96 },
          }
        }
        layout
      >
        {/* Header + stepper */}
        <header className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                CTET 2026 Setup
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Answer a few quick questions to configure subjects.
              </p>
            </div>
            <motion.span
              key={step}
              className="text-[11px] text-slate-400"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Step {step + 1} of {totalSteps}
            </motion.span>
          </div>

          <StepIndicator step={step} />

          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
            />
          </div>
        </header>

        {/* Completed summaries */}
        {step > 0 && (
          <SummaryPill
            label="Level"
            value={level}
            onEdit={() => setStep(0)}
          />
        )}
        {step > 1 && (
          <SummaryPill
            label="Language"
            value={language}
            onEdit={() => setStep(1)}
          />
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              key="step-0"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1"
            >
              <h2 className="text-lg font-semibold mb-1">
                Select level for CTET 2026
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Your subjects and combinations depend on this choice.
              </p>

              <FancyOptionGroup
                name="level"
                value={level}
                onChange={setLevel}
                options={[
                  "Only Level 1",
                  "Only Level 2",
                  "Both Level 1 and 2",
                ]}
              />

              <FooterButtons canNext={!!level} onNext={next} />
            </motion.section>
          )}

          {step === 1 && (
            <motion.section
              key="step-1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1"
            >
              <h2 className="text-lg font-semibold mb-1">Language Subject</h2>
              <p className="text-xs text-slate-400 mb-4">
                Choose your main language combination.
              </p>

              <FancyOptionGroup
                name="language"
                value={language}
                onChange={setLanguage}
                options={[
                  "English and Hindi",
                  "Hindi and Sanskrit",
                  "English and Sanskrit",
                ]}
              />

              <FooterButtons canNext={!!language} onNext={next} onBack={back} />
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step-2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1"
            >
              <h2 className="text-lg font-semibold mb-1">
                Optional subject
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                This helps us recommend the right practice sets.
              </p>

              <FancyOptionGroup
                name="optional"
                value={optional}
                onChange={setOptional}
                options={["Social Studies", "Math and Science"]}
              />

              <FooterButtons
                canNext={!!optional}
                nextLabel="Finish setup"
                onNext={() => {
                  alert(
                    JSON.stringify({ level, language, optional }, null, 2)
                  );
                }}
                onBack={back}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div >
  );
}

/* ===================== Background ===================== */

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl"
        animate={{ x: [0, 40, -10, 0], y: [0, 20, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-16 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"
        animate={{ x: [0, -20, 30, 0], y: [0, -30, 10, 0] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/2 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ y: [0, -25, 15, 0] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "mirror" }}
      />
    </div>
  );
}

/* ===================== Stepper ===================== */

function StepIndicator({ step }: { step: number }) {
  const labels = ["Level", "Language", "Optional"];

  return (
    <div className="flex items-center justify-between gap-3">
      {labels.map((label, index) => {
        const active = index === step;
        const completed = index < step;

        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <motion.div
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold
                ${completed
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                  : active
                    ? "border-blue-400 bg-blue-500/20 text-blue-100"
                    : "border-slate-600 bg-slate-800 text-slate-400"
                }`}
              animate={
                active
                  ? {
                    boxShadow:
                      "0 0 0 1px rgba(59,130,246,0.7), 0 0 18px rgba(96,165,250,0.7)",
                    scale: [1, 1.05, 1],
                  }
                  : { boxShadow: "0 0 0 rgba(0,0,0,0)", scale: 1 }
              }
              transition={
                active
                  ? {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                  }
                  : { duration: 0.2 }
              }
            >
              {completed ? "✓" : index + 1}
            </motion.div>
            <span className="text-[11px] text-slate-300">{label}</span>
            {index < labels.length - 1 && (
              <div className="ml-2 flex-1 h-px bg-gradient-to-r from-slate-700 to-slate-800" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===================== Fancy options ===================== */

function FancyOptionGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt;

        return (
          <motion.button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="relative w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-left text-sm text-slate-100 shadow-sm"
            whileHover={{ y: -3, rotateX: 12, rotateY: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            {/* glowing moving highlight that animates between selected cards */}
            {selected && (
              <motion.div
                layoutId={`${name}-highlight`}
                className="absolute inset-0 z-0 rounded-2xl border border-blue-400/60 bg-gradient-to-r from-blue-500/20 via-sky-400/15 to-indigo-500/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              />
            )}

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium">{opt}</span>
                <span className="text-[11px] text-slate-400">
                  {name === "level" && "Decides which CTET papers you appear in"}
                  {name === "language" &&
                    "Used for language pedagogy and main language paper"}
                  {name === "optional" &&
                    "Will affect your pedagogy & subject practice sets"}
                </span>
              </div>

              {/* animated check bubble */}
              <motion.div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2
                  ${selected
                    ? "border-white/80 bg-white/90"
                    : "border-slate-600 bg-slate-900"
                  }`}
                animate={{
                  scale: selected ? 1 : 0.92,
                  boxShadow: selected
                    ? "0 0 18px rgba(191,219,254,0.9)"
                    : "0 0 0 rgba(0,0,0,0)",
                }}
                // transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                {selected && (
                  <motion.span
                    className="h-3 w-3 border-b-2 border-r-2 border-slate-900 rotate-45"
                    initial={{ scale: 0, opacity: 0, rotate: -40 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                    }}
                  />
                )}
              </motion.div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ===================== Summary & footer ===================== */

function SummaryPill({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <motion.div
      className="mb-3 flex items-center justify-between rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-100 border border-emerald-400/40"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px]">
          ✓
        </span>
        <span className="font-medium">
          {label}:{" "}
          <span className="font-normal text-emerald-50/90">{value}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-[10px] text-emerald-100/80 hover:text-emerald-50 underline-offset-2 hover:underline"
      >
        Edit
      </button>
    </motion.div>
  );
}

function FooterButtons({
  canNext,
  onNext,
  onBack,
  nextLabel = "Next",
}: {
  canNext: boolean;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] text-slate-400 hover:text-slate-200"
        >
          Back
        </button>
      ) : (
        <span />
      )}

      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        whileTap={canNext ? { scale: 0.96 } : undefined}
        animate={
          canNext
            ? { boxShadow: "0 16px 40px rgba(59,130,246,0.6)" }
            : { boxShadow: "0 0 0 rgba(0,0,0,0)" }
        }
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide
          ${canNext
            ? "bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 text-slate-950"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
      >
        {nextLabel}
      </motion.button>
    </div>
  );
}