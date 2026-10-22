"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { TourStep } from "../../tour/GlobalTour";
import { usePreparationStore } from "../store/usePreparationDataStore";
import { trackEvent } from "@/lib/analytics/browser";
import { START_GUIDE_IDS } from "./startGuideIds";

// driver.js only loads when the tour actually opens.
const GlobalTour = dynamic(() => import("../../tour/GlobalTour"), { ssr: false });


const MAX_SHOWS = 2;
const storageKey = (courseId: string) => `cc-start-guide:${courseId}`;

const readCount = (courseId: string) => {
  try {
    return Number(localStorage.getItem(storageKey(courseId))) || 0;
  } catch {
    return MAX_SHOWS; // storage blocked: don't risk showing it every visit
  }
};

const writeCount = (courseId: string, n: number) => {
  try {
    localStorage.setItem(storageKey(courseId), String(n));
  } catch {
    // ignore
  }
};

const isVisible = (id: string) => {
  const el = document.getElementById(id);
  return !!el && el.offsetParent !== null;
};

/**
 * "Start here" pointer tour for new students on the preparation page (CC-79):
 * subject tabs → first free chapter → its first topic. Runs right after the
 * first-visit guide modal, and once more on a later visit if the student
 * still hasn't opened any content. The pulsing "start here" badge on the
 * first free topic is rendered by the Sidebar.
 */
export default function StartGuide({ courseId }: { courseId: string }) {
  const t = useTranslations("startGuide");
  const course = usePreparationStore((s) => s.course);
  const chapters = usePreparationStore((s) => s.chapters);
  const progressByTopicId = usePreparationStore((s) => s.progressByTopicId);
  const progressLoadedFor = usePreparationStore((s) => s.progressLoadedFor);
  const startGuideRequested = usePreparationStore((s) => s.startGuideRequested);
  const setStartGuideActive = usePreparationStore((s) => s.setStartGuideActive);

  const [steps, setSteps] = useState<TourStep[]>([]);
  const [open, setOpen] = useState(false);
  const decidedRef = useRef(false);
  const examName = course?.exam?.short_name ?? "";

  useEffect(() => {
    if (decidedRef.current || !course || !courseId) return;
    // Wait for this course's progress: "no progress" must be real.
    if (progressLoadedFor !== courseId) return;
    // The first-visit modal is still to come / on screen.
    if (!course.study_guide_seen && !startGuideRequested) return;

    const hasOpenedContent = Object.keys(progressByTopicId).length > 0;
    const count = readCount(courseId);
    if (hasOpenedContent || count >= MAX_SHOWS) {
      decidedRef.current = true;
      return;
    }
    // Needs a free topic to point at, visible (not behind the mobile topic view).
    if (!isVisible(START_GUIDE_IDS.topic)) return;

    const next: TourStep[] = [];
    if (isVisible(START_GUIDE_IDS.subjects)) {
      next.push({
        element: `#${START_GUIDE_IDS.subjects}`,
        popover: { title: t("step1Title"), description: t("step1Body") },
      });
    }
    if (isVisible(START_GUIDE_IDS.chapter)) {
      next.push({
        element: `#${START_GUIDE_IDS.chapter}`,
        popover: { title: t("step2Title"), description: t("step2Body") },
      });
    }
    next.push({
      element: `#${START_GUIDE_IDS.topic}`,
      popover: { title: t("step3Title"), description: t("step3Body") },
    });

    decidedRef.current = true;
    writeCount(courseId, count + 1);
    setSteps(next);
    setOpen(true);
    setStartGuideActive(true);
    trackEvent("guide_shown", { exam_name: examName, attempt: count + 1 });
  }, [
    course,
    courseId,
    chapters,
    progressByTopicId,
    progressLoadedFor,
    startGuideRequested,
    setStartGuideActive,
    examName,
    t,
  ]);

  // Leaving the page mid-tour must not leave the Unlock widget hidden.
  useEffect(() => () => setStartGuideActive(false), [setStartGuideActive]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setStartGuideActive(false);
  }, [setStartGuideActive]);

  if (!open) return null;

  return (
    <GlobalTour
      steps={steps}
      isOpen={open}
      onClose={handleClose}
      nextText={t("next")}
      prevText={t("skip")}
      doneText={t("done")}
      skipAsPrev
      onStepChange={(i) => trackEvent("guide_step_viewed", { exam_name: examName, step: i + 1 })}
      onSkip={(i) => trackEvent("guide_skipped", { exam_name: examName, step: i + 1 })}
      onComplete={() => trackEvent("guide_completed", { exam_name: examName })}
    />
  );
}
