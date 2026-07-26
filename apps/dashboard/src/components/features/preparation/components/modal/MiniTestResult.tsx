"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import { Button } from "@clearcut/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useMiniTestStore } from "../../store/useMiniTestStore";

import {
  CheckIcon,
  ChevronIcon,
  CircleIcon,
  CrossIcon,
} from "@/components/ui/icons";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useTranslations } from "next-intl";
import Text from "@clearcut/ui/text";

/* -------------------------------------------------------------------------- */
/*                             ANIMATION CONFIGS                              */
/* -------------------------------------------------------------------------- */

const tickPop = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: {
    type: "spring" as const,
    stiffness: 260,
    damping: 14,
  },
};

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function MiniTestResult() {
  const isMobile = useIsMobile();

  const { isOpen, closeModal, stack, open } = usePreparationModalStore();
  const active = stack[stack.length - 1];

  const { getResult } = useMiniTestStore();
  const result = getResult();

  /* ------------------------------ derived -------------------------------- */

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const shouldCelebrate = result.correct >= 3;

  /* ----------------------- smooth score animation ------------------------ */

  const scoreValue = useMotionValue(0);
  const smoothScore = useSpring(scoreValue, {
    stiffness: 120,
    damping: 18,
  });

  const [displayScore, setDisplayScore] = useState(0);

  useMotionValueEvent(smoothScore, "change", (latest) => {
    setDisplayScore(Math.round(latest));
  });

  useEffect(() => {
    if (!isOpen || active !== "mini-test-result") return;

    scoreValue.set(0);
    scoreValue.set(result.correct);
  }, [isOpen, active, result.correct, scoreValue]);

  /* ------------------------------ back handler ---------------------------- */

  // useBackHandler({
  //   isOpen: isOpen && active === "mini-test-result",
  //   onClose: () => closeModal("mini-test-result"),
  // });

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <AnimatePresence>
      {isOpen && active === "mini-test-result" && (
        <Container
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          isOpen={isOpen}
          maxWidth="md:max-w-[548px]"
          onClose={() => closeModal("mini-test-result")}
        >
          <div className="h-full md:max-h-[90vh] flex flex-col justify-between">
            <Header onClose={() => closeModal("mini-test-result")} />

            <Content
              result={result}
              displayScore={displayScore}
              shouldCelebrate={shouldCelebrate}
            />

            <Footer
              close={() => closeModal("mini-test-result")}
              restart={() => open("mini-test")}
            />
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

const Header = React.memo(function Header({
  onClose,
}: {
  onClose: () => void;
}) {
  const trans = useTranslations("modals.miniTestResult");

  return (
    <div className="sticky top-0 z-10 flex gap-4 px-4 py-4 bg-white justify-between">
      <div>
        <Text
          as="p"
          variant="heading-large"
          weight="semibold"
          color="gray-normal"
        >
          {trans("title")}
        </Text>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer"
        aria-label="Close"
      >
        <CrossIcon />
      </button>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                 CONTENT                                    */
/* -------------------------------------------------------------------------- */

const Content = React.memo(function Content({
  result,
  displayScore,
  shouldCelebrate,
}: {
  result: { correct: number; total: number };
  displayScore: number;
  shouldCelebrate: boolean;
}) {
  const trans = useTranslations("modals.miniTestResult");
  const delta = result.total - displayScore;

  const messageKey =
    delta === 0
      ? "messages.perfect"
      : delta === 1
        ? "messages.almostPerfect"
        : delta === 2
          ? "messages.goodProgress"
          : "messages.needsPractice";
  return (
    <div className="w-full flex justify-center relative">
      <div className="w-full bg-white flex flex-col gap-5 py-2 max-w-[400px] md:rounded-md">
        {shouldCelebrate && <ConfettiBurst />}

        <div className="flex flex-col gap-10 justify-center items-center px-3">
          {/* Tick */}
          <div className="flex flex-col items-center gap-2">
            <motion.div {...tickPop}>
              <CheckIcon
                variant="design"
                color="var(--icon-positive-subtle)"
                size={72}
              />
            </motion.div>
            <Text
              as="p"
              variant="heading-medium"
              weight="semibold"
              className="text-center"
              color="gray-normal"
            >
              {trans(messageKey)}
            </Text>
          </div>

          {/* Score */}
          <div className="border-2 border-[var(--border-gray-muted)] rounded-md flex flex-col justify-center items-center w-[140px] h-[110px]">
            <Text
              as="p"
              variant="body-large"
              weight="normal"
              color="gray-muted"
            >
              {trans("scoreLabel")}
            </Text>

            <div className="heading-xlarge !font-semibold flex items-center gap-1">
              <span>{displayScore}</span>
              <span>/{result.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                  FOOTER                                    */
/* -------------------------------------------------------------------------- */

const Footer = React.memo(function Footer({
  close,
  restart,
}: {
  close: () => void;
  restart: () => void;
}) {
  const trans = useTranslations("modals.miniTestResult");

  return (
    <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full  flex flex-col-reverse justify-between gap-2 max-w-[400px]">
          <div className="md:w-full">
            <Button
              onClick={restart}
              sx={{
                borderRadius: "50px",
              }}
              variant="soft"
              color="gray"
              fullWidth
            >
              <div className="flex gap-1 items-center">
                <span>{trans("buttons.improveScore")}</span>
                <CircleIcon size={20} color="#000" />
              </div>
            </Button>
          </div>

          <div className=" md:w-full">
            <Button
              onClick={close}
              size="lg"
              sx={{
                borderRadius: "50px",
              }}
              color="primary"
              fullWidth
            >
              <div className="flex gap-2 items-center justify-center">
                <span>{trans("buttons.continueLearning")}</span>
                <div className="w-5 h-5">
                  <ChevronIcon type="double" size={20} variant="right" />
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                             CONFETTI BURST                                 */
/* -------------------------------------------------------------------------- */

export const ConfettiBurst = () => {
  const pieces = Array.from({ length: 14 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-green-400"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 260,
            y: Math.random() * -200,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ left: "50%", top: "20%" }}
        />
      ))}
    </div>
  );
};
