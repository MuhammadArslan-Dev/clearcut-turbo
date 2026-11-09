"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import StepIndicatorCard from "../indicator/StepIndicatorCard";
import Skeleton from "@clearcut/ui/skeleton";
import { Card } from "@clearcut/ui/card";
import CheckIcon from "@/components/ui/icons/check-icon";
import { useExams } from "@/hooks/onboarding/useExams";
import { Exam } from "@/types/Exam";
import { StepProps } from "@/types/onboarding/onboarding";
import MainContainer from "@/components/ui/main-container";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { RotatingBadge } from "@/components/ui/animation/RotatingBadge";
import { enrolledToCourse } from "@/lib/api/onboarding";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import { useCourseFilters } from "@/hooks/course/useCourseFilters";
import Filters from "@/components/ui/widgets/filter/Filters";
import MainButton from "@/components/ui/button/main-button";
import { useOnboardingCelebrationStore } from "@/store/onboarding/useOnboardingCelebrationStore";
import { ApiError, isNetworkFailure } from "@/lib/api/api-error";
import { logger } from "@/lib/sentry/sentry-logger";
import { useQueryClient } from "@tanstack/react-query";
import { LEVELS_QUERY_KEY, prefetchLevels } from "@/hooks/onboarding/useLevels";
import type { Level } from "@/lib/api/onboarding";
import { needsLevelChoice } from "@/lib/onboarding/levelChoice";

// Completion animation after enrolling (phase 84). Set NEXT_PUBLIC_LEGACY_ONBOARDING=true (and rebuild) to go back to the
// plain redirect; nothing else needs to change.
const USE_COMPLETION_MOTION = process.env.NEXT_PUBLIC_LEGACY_ONBOARDING !== "true";
const ENROLL_TIMEOUT_MS = 40_000;

export default function ExamStep({
  data,
  steps,
  currentStep,
  updateData,
  goNext,
  goBack,
}: StepProps) {
  const t = useTranslations("");
  const queryClient = useQueryClient();
  // The wizard adds a "level" step when flag `onboarding_level_step` is on (CC-81). Without it: enrol here, as before.
  const levelStepOn = steps.some((s) => s.id === "level");

  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Shown above Continue when enrolling fails (copy reused from the enrolment modal's error messages).
  const [enrollError, setEnrollError] = useState<"network" | "generic" | null>(null);
  // Continue is not ready until an exam is picked; a tap on it says why (CC-90).
  const [pickHint, setPickHint] = useState(false);
  useEffect(() => {
    if (data.exam) setPickHint(false);
  }, [data.exam]);
  const errorT = useTranslations("modals.buySingleCourseModal.error");

  // 🔹 Reset level on mount
  useEffect(() => {
    updateData({ level: null });

    // Drop a stale `?level=` from the URL. Deliberately NOT router.replace():
    // the wrapped router (@/i18n/navigation) starts the global top progress
    // bar + click-shield, and that is only cleared when the PATHNAME changes
    // (NavigationProgress) — a same-path query cleanup never changes it, so
    // the shield stayed up forever and the exam list could not be clicked
    // ("stuck on the loader" right after Continue on the language step).
    // history.replaceState keeps Next's useSearchParams in sync without any
    // navigation, and uses the real location so the /hi or /mr prefix stays.
    const url = new URL(window.location.href);
    if (url.searchParams.has("level")) {
      url.searchParams.delete("level");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { exams: examsResponse, loading, error } = useExams();

  // 🔹 Normalize exams safely
  const exams: Exam[] = Array.isArray(examsResponse)
    ? examsResponse
    : (examsResponse?.data ?? []);

  const {
    stateTabs: stateTabs2,
    setSelectedState: setSelectedState2,
    filteredExams: filteredExams2,
  } = useCourseFilters(exams);

  // 🔹 Select exam
  const selectExam = useCallback(
    (exam: Exam) => updateData({ exam }),
    [updateData],
  );

  // 🔹 One-time pin target: the exam that arrived via the `?course=`
  // parameter (stashed as UPCOMING_COURSE by OnboardingWizard). Set exactly
  // once, by the restore effect below, and never touched again — this is
  // what keeps the list order frozen after the initial arrangement.
  const [initialPinnedCode, setInitialPinnedCode] = useState<string | null>(
    null,
  );

  // 🔹 Restore upcoming course
  useEffect(() => {
    const course = localStorage.getItem("UPCOMING_COURSE");
    if (!course) return;

    const alreadySelected = exams.find(
      (item) => item?.short_name?.toLowerCase() === course.toLowerCase(),
    );

    if (alreadySelected) {
      selectExam(alreadySelected);
      setInitialPinnedCode(alreadySelected.short_name?.toLowerCase() ?? null);
      localStorage.removeItem("UPCOMING_COURSE");
    }
  }, [exams, selectExam]);

  // 🔹 Pin the parameter-selected exam to the top of the list, once, on
  // initial load only. This is keyed off `initialPinnedCode` (set once above)
  // rather than `data.exam` — the previous version re-pinned on every
  // selection, so manually picking a different exam afterwards reshuffled
  // the whole list. Selecting a different exam still updates `data.exam`
  // (for the checkmark/highlight below) but no longer changes the order.
  const orderedExams = useMemo(() => {
    if (!initialPinnedCode) return filteredExams2;
    const pinnedIndex = filteredExams2.findIndex(
      (exam) => exam.short_name?.toLowerCase() === initialPinnedCode,
    );
    if (pinnedIndex <= 0) return filteredExams2;
    const reordered = filteredExams2.slice();
    const [pinned] = reordered.splice(pinnedIndex, 1);
    reordered.unshift(pinned);
    return reordered;
  }, [filteredExams2, initialPinnedCode]);

  const isLoading = loading && !error;

  // Flag on: warm the paper/subject list as soon as an exam is picked, so the next step opens without a wait.
  useEffect(() => {
    if (levelStepOn && data.exam?.id) void prefetchLevels(queryClient, data.exam.id);
  }, [levelStepOn, data.exam?.id, queryClient]);

  const { buttonPhase } = useButtonArrowAnimation({
    data: !!data.exam || null,
  });

  // 🔥 Enroll handler with double-click protection
  const handleEnroll = useCallback(async () => {
    if (!data?.exam || isSubmitting) return;

    setIsSubmitting(true);
    setEnrollError(null);

    // CC-81: an exam with a real choice (more than one leaf) goes on to the paper/subject step, which enrols.
    // Anything unclear (levels did not load) falls through to the plain enrolment below.
    if (levelStepOn) {
      await prefetchLevels(queryClient, data.exam.id);
      const levels = queryClient.getQueryData<Level[]>(LEVELS_QUERY_KEY(data.exam.id));
      if (levels && needsLevelChoice(levels)) {
        trackEvent("Onboarding Step Completed", {
          step_number: 2,
          step_name: "exam_selection",
          exam_choice: data.exam.short_name,
        });
        setIsSubmitting(false);
        goNext();
        return;
      }
    }

    // The completion animation starts NOW (the learner sees their tap was taken) while the enrolment request runs; it can't
    // finish before the request succeeds, and a failure removes it again (see `fail` below).
    const celebrate = USE_COMPLETION_MOTION;
    const fail = (kind: "network" | "generic", err?: unknown) => {
      if (celebrate) useOnboardingCelebrationStore.getState().cancel();
      setEnrollError(kind);
      if (kind === "generic") {
        logger.error(err ?? new Error("enrolledToCourse resolved without success"), {
          tags: { module: "onboarding", action: "enroll" },
          extra: { examId: data.exam?.id, ...(err instanceof ApiError ? err.toContext() : {}) },
        });
      } else {
        logger.breadcrumb("Onboarding enrolment hit a network failure", { tags: { module: "onboarding" } });
      }
    };

    try {
      trackEvent("Onboarding Step Completed", {
        step_number: 2,
        step_name: "exam_selection",
        exam_choice: data?.exam?.short_name,
      });
      if (celebrate) {
        useOnboardingCelebrationStore.getState().start({
          languageCode: String(data.language ?? ""),
          examShortName: data.exam.short_name ?? "",
          examState: data.exam.state,
          examType: data.exam.exam_type,
        });
      }
      // A request that never answers must not trap the learner behind the animation.
      let giveUp: ReturnType<typeof setTimeout> | undefined;
      const response = await Promise.race([
        enrolledToCourse({ exam_id: data.exam.id }),
        new Promise<never>((_, reject) => {
          giveUp = setTimeout(() => reject(new TypeError("enrolment timed out: network")), ENROLL_TIMEOUT_MS);
        }),
      ]).finally(() => clearTimeout(giveUp));

      if (response.status) {
        trackEvent("Onboarding Completed", {
          entry_step_name: "language_selection",
          up_onboarding_status: "completed",
          up_chosen_exam_id: data.exam.short_name ?? "",
          up_preferred_app_language: data.language as AppLanguageCode,
        });

        // The animation lives in the locale layout, so it keeps playing across this navigation and lifts over the dashboard.
        if (celebrate) useOnboardingCelebrationStore.getState().markEnrolled();
        router.replace("/dashboard?user_type=new");
      } else {
        fail("generic");
      }
    } catch (err) {
      fail(isNetworkFailure(err) ? "network" : "generic", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, isSubmitting, router, levelStepOn, queryClient, goNext]);

  return (
    <MainContainer maxWidth={"max-w-[850px]"} padding="md:pt-20">
      <div className="flex flex-col gap-2 pb-[60px] md:pb-0">
        <StepIndicatorCard
          data={steps}
          currentStep={currentStep}
          title={t("Onboarding.exam.select_exam")}
          titleHeightLight={t("Onboarding.exam.highlight_text")}
          description={t("Onboarding.exam.description")}
          goBack={goBack}
        />

        {/* 🔹 Filters */}
        <div className="bg-white p-3 flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-4">
            {isLoading ? (
              // Varied widths (not one repeated size) so the placeholder row
              // reads as "state name chips" rather than a row of identical bars.
              [72, 96, 64, 88, 78].map((width, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width={width}
                  height={32}
                  borderRadius={"999px"}
                  className="shrink-0"
                />
              ))
            ) : error ? (
              <p className="text-sm text-red-500">Failed to load exams.</p>
            ) : (
              <Filters
                titleFont="body-small !font-semibold text-surface-gray-subtle"
                badgeFont="body-medium"
                paddingX="px-4"
                title={t("examType.selectState")}
                borderRadius="full"
                marginX="-mx-3 px-3"
                FilterItem={stateTabs2}
                onClick={setSelectedState2}
              />
            )}
          </div>
        </div>

        {/* 🔹 Exam Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 py-4 bg-white mb-3.5 md:mb-0">
          {isLoading ? (
            // Mirrors the real card 1:1 — same padding/radius/border and the
            // same two-line-plus-indicator shape — so nothing shifts height
            // when the real data swaps in, and enough of them (6, a full
            // 2-row grid on desktop) to fill the space real results would.
            Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                padding={"8px 20px"}
                borderRadius={8}
                bgcolor="white"
                bordercolor="#eee"
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1.5 py-1">
                    <Skeleton variant="rectangular" width={110} height={20} borderRadius={4} />
                    <Skeleton variant="rectangular" width={80} height={14} borderRadius={4} />
                  </div>
                  <Skeleton variant="circular" width={16} height={16} />
                </div>
              </Card>
            ))
          ) : error ? (
            <p className="text-sm text-red-500">Failed to load exams.</p>
          ) : (
            orderedExams.map((exam, index) => {
              const selected = data?.exam?.exam_id === exam.exam_id;

              return (
                <Card
                  key={exam.exam_id}
                  padding={"8px 20px"}
                  borderRadius={8}
                  cursor="pointer"
                  bgcolor={selected ? "var(--color-primary-subtle)" : "white"}
                  bordercolor={selected ? "var(--color-brand)" : "#ccc"}
                  className={`exam-card transition-all duration-200 ease-out ${
                    selected
                      ? "scale-[1.005]"
                      : "hover:-translate-y-0.5 hover:shadow-sm"
                  }`}
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => selectExam(exam)}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="heading-medium !font-semibold text-surface-gray-normal">
                        {exam.short_name} Exam
                      </p>
                      <p className="body-small text-surface-gray-muted">
                        {exam.state} ({exam.exam_type})
                      </p>
                    </div>

                    {selected ? (
                      <CheckIcon size={16} />
                    ) : (
                      <div className="border border-gray-400 w-4 h-4 rounded-full" />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* 🔹 Bottom Button */}
        <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static">
          <div className="flex flex-col gap-2 items-center">
            {enrollError && (
              <p role="alert" className="body-small text-center text-red-500 w-full max-w-[400px]">
                {errorT(enrollError)}
              </p>
            )}
           {/* The hint floats above the button (absolute), so showing it never moves the button. */}
           <div className="relative w-full">
            {pickHint && !data.exam && !enrollError && (
              <p role="status" className="absolute bottom-full left-0 right-0 pb-1 bg-white body-small !font-semibold text-center text-brand">
                {t("Onboarding.pickOption")}
              </p>
            )}
           <MainButton
              text={t("actions.continue")}
              fullWidth={true}
              showShimmer={
                buttonPhase === "shimmer" ||
                (buttonPhase === "icon" && !isSubmitting)
              }
              disabled={isSubmitting}
              notReady={!data.exam}
              onNotReadyTap={() => setPickHint(true)}
              onClick={handleEnroll}
              loading={isSubmitting} // ✅ loader support
            />
           </div>
            

            <RotatingBadge
              animationDuration={0.45}
              direction="up"
              items={["Videos", "Notes", "PDFs", "Tests"]}
            />
          </div>
        </div>
      </div>
    </MainContainer>
  );
}
