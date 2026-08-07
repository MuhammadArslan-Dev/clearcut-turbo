"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { useExamStore } from "../store/useExamStore";

import { SectionHeader, StatusItem } from "./QuestionNavigationPanel";

import Text from "@clearcut/ui/text";

import { AttemptSection } from "../types/exam";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import { limitChars } from "@clearcut/utils/text-limit";

export default function QuestionViewPanel() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const { getExamContext, getSectionStats, jumpTo, language } = useExamStore();

  // ===============================
  // DATA
  // ===============================

  const { sections, sectionIndex, questionIndex, currentSection } =
    getExamContext();

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto open active section
  useEffect(() => {
    setOpenSection(sectionIndex);
  }, [sectionIndex]);

  // Auto scroll
  useEffect(() => {
    if (openSection === null) return;

    const el = sectionRefs.current[openSection];

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
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
        {sections.map((section: AttemptSection, i) => {
          const isOpen = openSection === i;

          const stats = getSectionStats(i);

          return (
            <section
              key={i}
              //   ref={(el) => {
              //     sectionRefs.current[i] = el as HTMLDivElement | null;
              //   }}
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

              {/* QUESTIONS LIST */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key={i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-4 md:px-2 pb-2">
                      {section.questions.map((q: any, qIndex: number) => {
                        // ===============================
                        // STATUS COLOR
                        // ===============================

                        let bg = "!bg-[var(--background-gray-subtle)]";
                        let border = "!border-[var(--background-gray-subtle)]";
                        let text = null;

                        if (q.marked_for_review) {
                          bg = "!bg-[var(--icon-notice-subtle)]";
                          border = "!border-[var(--icon-notice-subtle)]";
                          text = "!text-white";
                        } else if (q.user_option) {
                          bg = "!bg-[var(--icon-positive-subtle)]";
                          border = "!border-[var(--icon-positive-subtle)]";
                          text = "!text-white";
                        } else if (q.visited) {
                          bg =
                            "!bg-[var(--icon-negative-normal)] !text-white border-red-400";
                          border = "!border-[var(--icon-negative-normal)]";
                          text = "!text-white";
                        }

                        // Current question
                        const isActive =
                          sectionIndex === i && questionIndex === qIndex;

                        return (
                          <QOption
                            key={qIndex}
                            value={{
                              text: limitChars(
                                currentSection.section.type === "subject"
                                  ? q?.question?.translations?.find(
                                      (t: any) => t.locale === language,
                                    )?.text
                                  : (q?.question?.translations?.[0]?.text ??
                                      "Question"),
                                150,
                              ),
                              index: qIndex + 1,
                              //   image:
                              //     q?.question?.translations?.[0]?.image ?? "",
                            }}
                            mainContainer={{
                              borderwidth: isActive ? 1 : 1,
                              // bgcolor: isActive ? "!bg-brand/9" : "",
                              bordercolor: isActive ? "!border-brand" : "",
                            }}
                            counter={{
                              fontFamily: "body-small",
                              showCounting: true,
                              width: "w-6",
                              height: "h-6",
                              color: text!,
                              backgroundColor: bg,
                              borderColor: border,
                            }}
                            //   // 🔥 Only local select
                            onClick={() => {
                              jumpTo(i, qIndex);
                            }}
                          />
                        );
                      })}
                    </div>
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
