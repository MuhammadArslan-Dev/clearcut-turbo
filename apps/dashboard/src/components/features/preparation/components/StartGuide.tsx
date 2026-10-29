"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { TourStep } from "../../tour/GlobalTour";
import { findTourTarget, isTourContentLoading } from "../../tour/tourTargets";
import { usePreparationStore } from "../store/usePreparationDataStore";
import { usePreparationModalStore } from "../store/usePreparationModalStore";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { trackEvent } from "@/lib/analytics/browser";
import { claimTopicTour } from "@/lib/api/userState";
import { PREP_TOUR } from "./startGuideIds";
import { PREP_TOUR_STEPS, type PrepTourName, type PrepTourStep } from "./prepTourSteps";

// driver.js only loads when a tour actually opens.
const GlobalTour = dynamic(() => import("../../tour/GlobalTour"), { ssr: false });

// PreparationShell switches to the sliding list / topic layout below 900px.
const MOBILE_LAYOUT = "(max-width: 899px)";

const onScreen = (step: PrepTourStep) => !!findTourTarget(PREP_TOUR[step.target]);

/**
 * Polls until the tour's required elements are on screen, no loading
 * skeleton is (TOUR_LOADING), and the set of on-screen steps has stopped
 * changing — topic content arrives after its fetch, and the mobile topic
 * view slides in — or gives up after 8 s.
 */
async function waitForSteps(
  steps: PrepTourStep[],
  isCancelled: () => boolean,
): Promise<PrepTourStep[] | null> {
  const deadline = Date.now() + 8000;
  let last = "";
  let stablePolls = 0;
  while (Date.now() < deadline) {
    if (isCancelled()) return null;
    const found = steps.filter(onScreen);
    const key = found.map((s) => s.target).join();
    const ready =
      found.length > 0 &&
      steps.every((s) => !s.required || found.includes(s)) &&
      !isTourContentLoading();
    stablePolls = ready && key === last ? stablePolls + 1 : 0;
    last = key;
    if (stablePolls >= 2) return found;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return null;
}

type RunName = PrepTourName | "replay";
type Run = { name: RunName; defs: PrepTourStep[]; steps: TourStep[] };

/**
 * Preparation page tours (see prepTourSteps.ts):
 * - "start" (CC-79): subject tabs → first free chapter → its first topic.
 *   Right after the first-visit guide modal, and once more on a later visit
 *   if the student still hasn't opened any content. The pulsing "start
 *   here" badge on that topic is rendered by the Sidebar.
 * - "topic": what an open topic offers and where to go next. Once per
 *   device, the first time a topic is opened (on desktop: another topic is
 *   picked, or the start tour was finished).
 * - "replay": the "How to use this page" link — every step on screen.
 */
export default function StartGuide({ courseId }: { courseId: string }) {
  const t = useTranslations("startGuide");
  const topicParam = useSearchParams().get("topic");
  const course = usePreparationStore((s) => s.course);
  const chapters = usePreparationStore((s) => s.chapters);
  const selectedTopicId = usePreparationStore((s) => s.selectedTopic?.id ?? null);
  const progressByTopicId = usePreparationStore((s) => s.progressByTopicId);
  const progressLoadedFor = usePreparationStore((s) => s.progressLoadedFor);
  const startGuideRequested = usePreparationStore((s) => s.startGuideRequested);
  const tourReplayRequested = usePreparationStore((s) => s.tourReplayRequested);
  const setStartGuideActive = usePreparationStore((s) => s.setStartGuideActive);
  const modalOpen = usePreparationModalStore((s) => s.isOpen);
  const paywallOpen = usePaywallsStore((s) => s.isOpen);

  const [run, setRun] = useState<Run | null>(null);
  const [startCompleted, setStartCompleted] = useState(false);
  // A tour is waiting for its elements or on screen: never start a second.
  const busyRef = useRef(false);
  const startDecidedRef = useRef(false);
  const topicDecidedRef = useRef(false);
  const firstTopicIdRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);
  const examName = course?.exam?.short_name ?? "";
  // Same test as the Sidebar's reward badge: anything but a bought course.
  const isFreeUser = course?.status !== "active";

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // "shown" | "unavailable" (elements not on screen yet - try again later) |
  // "denied" (`mayShow` said no - never try again).
  const launch = useCallback(
    async (
      name: RunName,
      defs: PrepTourStep[],
      mayShow?: () => Promise<boolean>,
    ): Promise<"shown" | "unavailable" | "denied"> => {
      if (busyRef.current) return "unavailable";
      busyRef.current = true;
      const found = await waitForSteps(
        defs.filter((s) => isFreeUser || !s.freeUsersOnly),
        () => unmountedRef.current,
      );
      if (!found || unmountedRef.current) {
        busyRef.current = false;
        return "unavailable";
      }
      // The once-only decision is made by the backend, as late as possible
      // (right before the tour really opens), so only a tour that is actually
      // shown uses up the one allowed showing.
      if (mayShow && !(await mayShow().catch(() => false))) {
        busyRef.current = false;
        return "denied";
      }
      if (unmountedRef.current) {
        busyRef.current = false;
        return "unavailable";
      }
      setRun({
        name,
        defs: found,
        steps: found.map((def) => ({
          element: () => findTourTarget(PREP_TOUR[def.target]) as Element,
          popover: { title: t(def.title), description: t(def.body) },
          advanceOnClick: def.advanceOnClick,
        })),
      });
      setStartGuideActive(true);
      return "shown";
    },
    [setStartGuideActive, t, isFreeUser],
  );

  // "start" tour - only straight after the learner pressed "Start Learning" in
  // the first-visit guide, in this session (never again on a later visit, and
  // never after the guide was skipped).
  useEffect(() => {
    if (startDecidedRef.current || !course || !courseId) return;
    if (!startGuideRequested) return;
    // Wait for this course's progress: "no progress" must be real.
    if (progressLoadedFor !== courseId) return;
    if (modalOpen) return;

    startDecidedRef.current = true;
    if (Object.keys(progressByTopicId).length > 0) return;

    void launch("start", PREP_TOUR_STEPS.filter((s) => s.tour === "start")).then((result) => {
      // Not on screen yet (mobile topic view, chapters loading): try again
      // on the next change.
      if (result !== "shown") {
        startDecidedRef.current = false;
        return;
      }
      trackEvent("guide_shown", { exam_name: examName, attempt: 1, tour: "start" });
    });
  }, [
    course,
    courseId,
    chapters,
    progressByTopicId,
    progressLoadedFor,
    startGuideRequested,
    modalOpen,
    launch,
    examName,
  ]);

  // "topic" tour - once per user and course, decided by the backend claim.
  useEffect(() => {
    if (selectedTopicId !== null && firstTopicIdRef.current === null) {
      firstTopicIdRef.current = selectedTopicId;
    }
    if (topicDecidedRef.current || run || busyRef.current || !course) return;
    if (modalOpen || paywallOpen) return;
    const opened = window.matchMedia(MOBILE_LAYOUT).matches
      ? topicParam !== null
      : startCompleted || (selectedTopicId !== null && selectedTopicId !== firstTopicIdRef.current);
    if (!opened) return;

    topicDecidedRef.current = true;
    void launch(
      "topic",
      PREP_TOUR_STEPS.filter((s) => s.tour === "topic"),
      // A failed claim counts as "no": fail closed rather than risk a repeat.
      () => claimTopicTour(courseId).then((res) => res.claimed),
    ).then((result) => {
      if (result === "unavailable") {
        topicDecidedRef.current = false;
        return;
      }
      if (result === "shown") {
        trackEvent("guide_shown", { exam_name: examName, attempt: 1, tour: "topic" });
      }
    });
  }, [
    course,
    courseId,
    selectedTopicId,
    topicParam,
    startCompleted,
    modalOpen,
    paywallOpen,
    run,
    launch,
    examName,
  ]);

  // "How to use this page"
  useEffect(() => {
    if (!tourReplayRequested || run || busyRef.current) return;
    void launch(
      "replay",
      PREP_TOUR_STEPS.map((s) => ({ ...s, required: false })),
    ).then((result) => {
      if (result !== "shown") {
        usePreparationStore.setState({ tourReplayRequested: false });
        return;
      }
      // Seen it all now: the automatic tours stay away (also on the backend).
      startDecidedRef.current = true;
      topicDecidedRef.current = true;
      void claimTopicTour(courseId).catch(() => {});
      trackEvent("guide_shown", { exam_name: examName, attempt: 1, tour: "replay" });
    });
  }, [tourReplayRequested, run, launch, examName, courseId]);

  // Leaving the page mid-tour must not leave the Unlock widget hidden.
  useEffect(() => () => setStartGuideActive(false), [setStartGuideActive]);

  const handleClose = useCallback(() => {
    busyRef.current = false;
    setRun(null);
    setStartGuideActive(false);
  }, [setStartGuideActive]);

  if (!run) return null;

  const stepName = (i: number) => run.defs[i]?.target ?? "";

  return (
    <GlobalTour
      steps={run.steps}
      isOpen
      onClose={handleClose}
      nextText={t("next")}
      prevText={t("skip")}
      doneText={t("done")}
      skipAsPrev
      onStepChange={(i) =>
        trackEvent("guide_step_viewed", {
          exam_name: examName,
          step: i + 1,
          step_name: stepName(i),
          tour: run.name,
        })
      }
      onSkip={(i) =>
        trackEvent("guide_skipped", {
          exam_name: examName,
          step: i + 1,
          step_name: stepName(i),
          tour: run.name,
        })
      }
      onComplete={() => {
        trackEvent("guide_completed", { exam_name: examName, tour: run.name });
        if (run.name === "start") setStartCompleted(true);
      }}
    />
  );
}
