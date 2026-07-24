"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

import {
  Attempt,
  createChapterTest,
  createFullLengthTest,
  createSectionsTest,
} from "@/lib/tests/getExam";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */

const COUNTDOWN_TIME = 5;

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export default function CountDownModal() {
  const { isOpen, test, closeModal, stack, sectionId } =
    useTestSeriesModalStore();

  const { paper } = useTestListDataStore();

  const router = useRouter();
  const { get } = useQueryParams();
  const { courseId } = useParams();

  const testType = get("testType");
  const active = stack[stack.length - 1];

  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);

  const hasCreatedRef = useRef(false);

  /* -------------------------------------------------------------------------- */
  /*                         CREATE TEST (BACKGROUND)                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return;
    if (active !== "test-start-countdown") return;
    if (hasCreatedRef.current) return;

    let isMounted = true;
    hasCreatedRef.current = true;

    const run = async () => {
      try {
        let res;

        if (testType === "sectional-tests") {
          res = await createSectionsTest({
            testId: test?.id!,
            paperId: paper?.id!,
            sectionId: sectionId!,
            courseId: courseId as string,
            testType: test?.st_status!,
          });
        }

        if (testType === "chapter-tests") {
          res = await createChapterTest({
            testId: test?.id!,
            paperId: paper?.id!,
            chapterId: sectionId!,
            courseId: courseId as string,
          });
        }

        if (testType === "full-length-papers") {
          res = await createFullLengthTest({
            testId: test?.id!,
            paperId: paper?.id!,
            courseId: courseId as string,
            testType: test?.st_status!,
          });
        }

        if (res?.data) {
          setAttempt(res.data);
        }
      } catch (error) {
        console.error("Failed to create test:", error);
        hasCreatedRef.current = false;
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    active,
    testType,
    test?.id,
    test?.st_status,
    paper?.id,
    sectionId,
    courseId,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                          START COUNTDOWN                                   */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return;
    if (active !== "test-start-countdown") return;

    setTimeLeft(COUNTDOWN_TIME);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, active]);

  /* -------------------------------------------------------------------------- */
  /*                         REDIRECT WHEN READY                                */
  /* -------------------------------------------------------------------------- */

  const readyToStart = timeLeft === 0 && attempt?.uuid;

  useEffect(() => {
    if (!readyToStart) return;

    closeModal("pre-test-confirmation");
    closeModal("test-start-countdown");

    router.push(`/exam/${attempt.uuid}`);
  }, [readyToStart, attempt?.uuid, closeModal, router]);

  /* -------------------------------------------------------------------------- */
  /*                         RESET WHEN MODAL CLOSES                            */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) {
      setAttempt(null);
      setTimeLeft(COUNTDOWN_TIME);
      hasCreatedRef.current = false;
    }
  }, [isOpen]);

  /* -------------------------------------------------------------------------- */
  /*                              EARLY RETURN                                  */
  /* -------------------------------------------------------------------------- */

  if (!isOpen || active !== "test-start-countdown") return null;

  /* -------------------------------------------------------------------------- */
  /*                             PROGRESS RING                                  */
  /* -------------------------------------------------------------------------- */

  const progress = (timeLeft / COUNTDOWN_TIME) * 100;
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (progress / 100) * circumference;

  /* -------------------------------------------------------------------------- */
  /*                                   JSX                                      */
  /* -------------------------------------------------------------------------- */

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[420px]"
        onClose={() => {}}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative flex flex-col items-center justify-center"
        >
          <div className="w-full rounded-2xl bg-white shadow-xl border border-white p-8 flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-4 px-4 py-1 rounded-full text-xs font-semibold bg-brand/9 text-brand"
            >
              Get Ready
            </motion.div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Test Starting Soon
            </h2>

            <p className="text-sm text-gray-500 mb-6 text-center">
              Focus and prepare yourself
            </p>

            <div className="relative w-36 h-36 mb-6">
              <svg
                className="w-full h-full rotate-[-90deg]"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#E5E7EB"
                  strokeWidth="5"
                  fill="none"
                />

                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 0.6 }}
                />

                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#0083ff" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  key={timeLeft}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-4xl font-extrabold text-gray-900"
                >
                  {timeLeft}
                </motion.span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {timeLeft === 0 && !attempt
                ? "Preparing your test..."
                : "The test will begin automatically"}
            </p>
          </div>
        </motion.div>
      </Container>
    </AnimatePresence>
  );
}
