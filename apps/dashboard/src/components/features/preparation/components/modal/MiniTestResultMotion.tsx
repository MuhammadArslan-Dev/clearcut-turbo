"use client";

/**
 * Topic Test result screen built on @clearcut/motion's TestResult (score ring count-up, Nibbu, confetti on
 * a cleared cutoff, stat chips). Same open/close/restart wiring as the previous screen.
 *
 * The previous design is KEPT in ./MiniTestResult.tsx (untouched). To switch back, set
 * USE_MOTION_RESULT = false in components/layout/preparation/PreparationShell.tsx.
 */
import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import { TestResult } from "@clearcut/motion/test/flow";

import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { useMiniTestStore } from "../../store/useMiniTestStore";
import { getLocalizedName } from "@/components/features/preparation/util/getLocalizedName";
import { courseLanguageToLocale, toContentLocale } from "@/utils/text/contentLocale";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { CrossIcon } from "@/components/ui/icons";

export default function MiniTestResultMotion() {
  const isMobile = useIsMobile();
  const { isOpen, closeModal, stack, open } = usePreparationModalStore();
  const active = stack[stack.length - 1];

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
          <ResultBody
            close={() => closeModal("mini-test-result")}
            // close this result BEFORE reopening the test (same pattern MiniTest uses for its own result), otherwise a
            // stale "mini-test-result" stays in the modal stack and reappears after the next close
            restart={() => {
              closeModal("mini-test-result");
              open("mini-test");
            }}
          />
        </Container>
      )}
    </AnimatePresence>
  );
}

function ResultBody({ close, restart }: { close: () => void; restart: () => void }) {
  const trans = useTranslations("modals.miniTestResult");
  const { getResult } = useMiniTestStore();
  const { course, selectedTopic } = usePreparationStore();

  const result = getResult();
  // Content (topic name) follows the course language; the screen's own copy follows the UI locale, like the
  // previous result screen, so the library text and the app-translated buttons are always the same language.
  const language = toContentLocale(courseLanguageToLocale(course?.language));
  const uiLocale = useLocale();
  const lang = uiLocale === "en" ? "en" : "hi";
  const topicName = selectedTopic ? getLocalizedName(selectedTopic, language) : undefined;

  const total = result.total;
  const data = useMemo(
    () => ({
      score: result.correct,
      maxScore: Math.max(1, total),
      correct: result.correct,
      wrong: result.incorrect,
      skipped: Math.max(0, total - result.correct - result.incorrect),
      // no timeTakenSec: this test is untimed and the store does not track it, so the Time line is hidden
    }),
    [result.correct, result.incorrect, total],
  );

  return (
    <div role="group" className="relative bg-white">
      <button
        type="button"
        onClick={close}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-surface-gray-normal hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
        aria-label={trans("closeLabel")}
      >
        <CrossIcon size={26} color="currentColor" />
      </button>

      <div className="max-h-[90dvh] overflow-y-auto px-4 pb-6 pt-8 sm:px-6 [@media(max-width:600px)_and_(max-height:800px)]:pb-3 [@media(max-width:600px)_and_(max-height:800px)]:pt-7">
        <TestResult
          type="topic"
          lang={lang}
          data={data}
          weakArea={topicName}
          // the app's own Button component, same markup as the previous result screen (no new button)
          actions={
            <>
              <Button onClick={close} size="lg" sx={{ borderRadius: "50px" }} color="primary" fullWidth>
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
            </>
          }
        />
      </div>
    </div>
  );
}
