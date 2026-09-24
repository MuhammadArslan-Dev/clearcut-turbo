"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import Text from "@clearcut/ui/text";
import CounterCard from "@/components/ui/cards/CounterCard";
import { ChevronIcon } from "@/components/ui/icons";
import QuestionStatusLegend from "@/components/features/exam/components/cards/QuestionStatusLegend";

export type QuestionDockStatus = "notVisited" | "answered" | "notAnswered" | "review";

export type QuestionDockItem = {
  status: QuestionDockStatus;
  isActive: boolean;
};

type QuestionsDockProps = {
  /** The ACTIVE SECTION's questions only (Daily Test has just one section). */
  questions: QuestionDockItem[];
  /** Index within `questions` (not the overall exam). */
  onSelect: (index: number) => void;
  defaultExpanded?: boolean;
};

const STATUS_STYLE: Record<QuestionDockStatus, { bg: string; border: string; text: string }> = {
  notVisited: { bg: "!bg-white", border: "!border-gray-200", text: "" },
  answered: { bg: "!bg-[var(--icon-positive-subtle)]", border: "!border-[var(--icon-positive-subtle)]", text: "!text-white" },
  notAnswered: { bg: "!bg-[var(--icon-negative-normal)]", border: "!border-[var(--icon-negative-normal)]", text: "!text-white" },
  review: { bg: "!bg-[var(--icon-notice-subtle)]", border: "!border-[var(--icon-notice-subtle)]", text: "!text-white" },
};

const ACTIVE_STYLE = { bg: "!bg-brand", border: "!border-brand", text: "!text-white" };

/**
 * Persistent, collapsible "Questions" dock for the exam attempt pages'
 * mobile footer — sits between the Save-and-Next action bar and the "Need
 * help?" bar (not a bottom-sheet modal). Shared by the full exam page and
 * the Daily Test attempt page; each feeds it its own active section's
 * questions (full-length: `section.questions`; Daily Test: its flat
 * `questions` array, since it has only one section).
 */
function QuestionsDock({ questions, onSelect, defaultExpanded = false }: QuestionsDockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col items-center gap-1.5 pt-1.5"
        aria-expanded={expanded}
        aria-label="Questions"
      >
        <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
        <span className="flex w-full items-center justify-between px-4 pb-1">
          <span className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-brand" />
            <Text as="span" variant="body-medium" weight="semibold" color="gray-normal">
              Questions
            </Text>
          </span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronIcon size={16} variant="down" />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-[40vh] overflow-y-auto px-4 pb-2">
              <div className="grid grid-cols-5 gap-2 pb-3">
                {questions.map((q, index) => {
                  const style = q.isActive ? ACTIVE_STYLE : STATUS_STYLE[q.status];
                  return (
                    <div key={index} onClick={() => onSelect(index)} className="cursor-pointer">
                      <CounterCard
                        value={String(index + 1)}
                        border={`border-2 ${style.border}`}
                        fontFamily="body-medium"
                        bgColor={style.bg}
                        rounded="rounded-md"
                        width="w-full"
                        height="h-9"
                        textClass={`!font-semibold ${style.text}`}
                      />
                    </div>
                  );
                })}
              </div>
              <QuestionStatusLegend />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(QuestionsDock);
