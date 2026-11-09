"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { useTestListDataStore } from "../../store/useTestListDataStore";

import TestStartIntro from "@/components/features/test-motion/TestStartIntro";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

import {
  Attempt,
  createChapterTest,
  createFullLengthTest,
  createSectionsTest,
} from "@/lib/tests/getExam";

import { useParams } from "next/navigation";
import { useFlowNavigation } from "@/hooks/navigation/useFlowNavigation";
import { apiErrorCode } from "@/lib/api/api-error";
import { useRouter } from "@/i18n/navigation";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export default function CountDownModal() {
  const { isOpen, test, closeModal, stack, sectionId } =
    useTestSeriesModalStore();

  const { paper } = useTestListDataStore();

  const t = useTranslations("testListContent");
  const tMotion = useTranslations("modals.examMotion");
  const currentExam = useGetCurrentCourseStore((s) => s.exam);

  const flow = useFlowNavigation();
  const router = useRouter();
  const course = useGetCurrentCourseStore((s) => s.course);
  const { get } = useQueryParams();
  const { courseId } = useParams();

  const testType = get("testType");
  const active = stack[stack.length - 1];

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  // The start animation (3-2-1-Go) has played out. The attempt is created in the background while it plays.
  const [introDone, setIntroDone] = useState(false);

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
        // The server now refuses a paid test when the plan has ended
        // (CC-129); the countdown would otherwise sit there forever.
        if (apiErrorCode(error) === "renewal_required") {
          closeModal("pre-test-confirmation");
          closeModal("test-start-countdown");
          handleOpenPaywall(router, "renewal_required", course);
          return;
        }
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
  /*                         REDIRECT WHEN READY                                */
  /* -------------------------------------------------------------------------- */

  const readyToStart = introDone && attempt?.uuid;

  useEffect(() => {
    if (!readyToStart) return;

    closeModal("pre-test-confirmation");
    closeModal("test-start-countdown");

    flow.push(`/exam/${attempt.uuid}`);
  }, [readyToStart, attempt?.uuid, closeModal, flow]);

  /* -------------------------------------------------------------------------- */
  /*                         RESET WHEN MODAL CLOSES                            */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) {
      setAttempt(null);
      setIntroDone(false);
      hasCreatedRef.current = false;
    }
  }, [isOpen]);

  /* -------------------------------------------------------------------------- */
  /*                              EARLY RETURN                                  */
  /* -------------------------------------------------------------------------- */

  if (!isOpen || active !== "test-start-countdown") return null;

  /* -------------------------------------------------------------------------- */
  /*                                   JSX                                      */
  /* -------------------------------------------------------------------------- */

  // Same title / scope / size / duration the pre-test confirmation shows (Pre-TestConfirmationModal).
  const testAny = test as
    | (NonNullable<typeof test> & {
        metadata?: { chapter_name?: string; section_name?: string };
        number_of_questions?: number;
        total_time?: number;
      })
    | null;
  const testNumber = String(test?.order ?? "");
  const kind =
    testType === "chapter-tests" ? "chapter" : testType === "full-length-papers" ? "full" : "sectional";
  const heading =
    kind === "chapter"
      ? t("testCard.chapterTitle", { number: testNumber })
      : kind === "full"
        ? t("sectionalTestModal.fullLengthTest", { number: testNumber })
        : t("sectionalTestModal.sectionTest", { number: testNumber });
  const scope =
    kind === "chapter"
      ? (testAny?.metadata?.chapter_name ?? testAny?.metadata?.section_name)
      : kind === "full"
        ? (currentExam?.name ?? currentExam?.short_name)
        : testAny?.metadata?.section_name;
  const questions = kind === "full" ? 150 : (testAny?.number_of_questions ?? (kind === "chapter" ? 10 : 30));
  const minutes =
    kind === "chapter"
      ? 10 // chapter tests are always 10 mins
      : kind === "full"
        ? 150
        : testAny?.total_time
          ? Math.round(testAny.total_time / 60)
          : 30;

  return (
    <TestStartIntro
      type={kind === "chapter" ? "topic" : "full"}
      label={tMotion(kind)}
      title={scope ? `${heading} · ${scope}` : heading}
      questions={questions}
      minutes={minutes}
      onStart={() => setIntroDone(true)}
    />
  );
}
