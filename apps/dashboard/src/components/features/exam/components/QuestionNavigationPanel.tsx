"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import CounterCard from "@/components/ui/cards/CounterCard";
import { ChevronIcon } from "@/components/ui/icons";
import Text from "@clearcut/ui/text";

import { motion, AnimatePresence } from "framer-motion";
import { useExamStore } from "../store/useExamStore";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

type QuestionStatus = "notVisited" | "answered" | "notAnswered" | "review";

type StatusSummary = {
  label: string;
  count: number;
  colorClass: string;
};

type SectionData = {
  id: string;
  title: string;
  totalQuestions: number;
  statusSummary: StatusSummary[];
};

/* -------------------------------------------------------------------------- */
/* Constants */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG: Record<QuestionStatus, StatusSummary> = {
  notVisited: {
    label: "Qs",
    count: 24,
    colorClass: "bg-gray-200",
  },
  answered: {
    label: "Qs",
    count: 2,
    colorClass: "bg-green-500",
  },
  notAnswered: {
    label: "Qs",
    count: 2,
    colorClass: "bg-red-500",
  },
  review: {
    label: "Qs",
    count: 1,
    colorClass: "bg-orange-400",
  },
};

/* -------------------------------------------------------------------------- */
/* Main Component */
/* -------------------------------------------------------------------------- */

function QuestionNavigationPanel() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const { getExamContext, getSectionStats, jumpTo,getStats } = useExamStore();


  // ===============================
  // DATA
  // ===============================

  const { sections, sectionIndex, questionIndex } = getExamContext();
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setOpenSection(sectionIndex);
  }, [sectionIndex]);

  useEffect(() => {
    if (openSection === null) return;

    const el = sectionRefs.current[openSection];

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center", // 👈 center vertically
    });
  }, [openSection]);

  // ===============================
  // HANDLERS
  // ===============================

  const toggleSection = useCallback((i: number) => {
    setOpenSection((prev) => (prev === i ? null : i));
  }, []);

  // ===============================
  // RENDER
  // ===============================

  if (!sections.length) return null;

  return (
    <aside className="w-full px-2 md:px-0">
      <div className="flex flex-col gap-6">
        {sections.map((section, i) => {
          const isOpen = openSection === i;

          const stats = getSectionStats(i);

          return (
            <section
              key={i}
              ref={(el) => {
                sectionRefs.current[i] = el as HTMLDivElement | null;
              }}
              className="flex flex-col gap-3"
            >
              {/* HEADER */}
              <SectionHeader
                title={section.section?.name ?? ""}
                total={stats.total}
                isOpen={isOpen}
                onToggle={() => {
                  sections.length > 1 && toggleSection(i);
                }}
                showButton={sections.length > 1}
              />

              {/* SUMMARY */}
              <div className="flex justify-between md:px-2">
                <StatusItem
                  label="QS"
                  count={stats.answered}
                  colorClass="bg-[var(--icon-positive-subtle)]"
                />

                <StatusItem
                  label="QS"
                  count={stats.notVisited}
                  colorClass="bg-[var(--background-gray-subtle)]"
                />

                <StatusItem
                  label="QS"
                  count={stats.review}
                  colorClass="bg-[var(--icon-notice-subtle)]"
                />

                <StatusItem
                  label="QS"
                  count={stats.total - stats.answered - stats.notVisited}
                  colorClass="bg-[var(--icon-negative-normal)]"
                />
              </div>

              {/* GRID */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key={i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <QuestionGrid
                      questions={section.questions}
                      sectionIndex={i}
                      currentSection={sectionIndex}
                      currentQuestion={questionIndex}
                      jumpTo={jumpTo}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

export default memo(QuestionNavigationPanel);

/* -------------------------------------------------------------------------- */
/* Sub Components */
/* -------------------------------------------------------------------------- */

export const StatusItem = memo(function StatusItem({
  label,
  count,
  colorClass,
}: StatusSummary) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-full ${colorClass}`} aria-hidden />

      <Text
        as="p"
        variant="body-medium"
        weight="normal"
        className="whitespace-nowrap"
      >
        {count} {label}
      </Text>
    </div>
  );
});

export const SectionHeader = memo(function SectionHeader({
  title,
  total,
  isOpen,
  onToggle,
  showButton = true,
}: {
  title: string;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  showButton?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left"
    >
      <p className="body-medium">
        {title}: <span className="font-semibold">{total} Qs</span>
      </p>

      {showButton && (
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
        >
          <ChevronIcon size={16} variant="down" color="#192839" />
        </motion.span>
      )}
    </button>
  );
});

export const QuestionGrid = memo(function QuestionGrid({
  questions,
  sectionIndex,
  currentSection,
  currentQuestion,
  jumpTo,
}: {
  questions: any[];
  sectionIndex: number;
  currentSection: number;
  currentQuestion: number;
  jumpTo: (s: number, q: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-3 md:px-2 pb-2">
      {questions.map((q, index) => {
        let bg = "!bg-[var(--background-gray-subtle)]";
        let border = "!border-[var(--background-gray-subtle)]";
        let text = null;

        const isActive =
          sectionIndex === sectionIndex && currentQuestion === index;

        if (isActive) {
          bg = "!bg-brand/20";
          border = "!border-brand";
          text = "!text-black";
        } else if (q.marked_for_review) {
          bg = "!bg-[var(--icon-notice-subtle)]";
          border = "!border-[var(--icon-notice-subtle)]";
          text = "!text-white";
        } else if (q.user_option) {
          bg = "!bg-[var(--icon-positive-subtle)]";
          border = "!border-[var(--icon-positive-subtle)]";
          text = "!text-white";
        } else if (q.visited) {
          bg = "!bg-[var(--icon-negative-normal)] !text-white border-red-400";
          border = "!border-[var(--icon-negative-normal)]";
          text = "!text-white";
        }

        return (
          <div
            key={index}
            onClick={() => jumpTo(sectionIndex, index)}
            className="cursor-pointer"
          >
            <CounterCard
              value={String(index + 1)}
              border={`border-2 ${border}`}
              fontFamily="body-large"
              bgColor={bg}
              rounded="rounded-md"
              textClass={`!font-semibold ${text}`}
            />
          </div>
        );
      })}
    </div>
  );
});
