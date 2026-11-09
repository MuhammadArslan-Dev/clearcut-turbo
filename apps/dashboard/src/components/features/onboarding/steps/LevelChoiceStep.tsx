"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@clearcut/ui/input";
import StepIndicatorCard from "../indicator/StepIndicatorCard";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import MainContainer from "@/components/ui/main-container";
import MainButton from "@/components/ui/button/main-button";
import { StepProps } from "@/types/onboarding/onboarding";
import { Level, LevelTranslation, enrolledToCourse, purchaseLevels } from "@/lib/api/onboarding";
import { useLevels, LEVELS_QUERY_KEY } from "@/hooks/onboarding/useLevels";
import { useRouter } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/browser";
import { AppLanguageCode } from "@/lib/analytics/events/onboarding";
import { parseTranslation } from "@/utils/text/translation";
import { ApiError, isNetworkFailure } from "@/lib/api/api-error";
import { logger } from "@/lib/sentry/sentry-logger";
import { useAuth } from "@/providers/AuthProvider";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import { MY_COURSES_KEY } from "@/hooks/course/useMyActiveCourses";
import { useOnboardingCelebrationStore } from "@/store/onboarding/useOnboardingCelebrationStore";
import { isPracticeTestEnabled } from "@/lib/experiments/practiceTestFlag";
import { getCourseState, offerPracticeTest } from "@/lib/api/userState";
import {
  SEARCH_MIN_OPTIONS,
  filterOptions,
  groupsToShow,
  initialPath,
  isPathComplete,
  pathAfterSelect,
} from "@/lib/onboarding/levelChoice";

// Same completion animation as the exam step (phase 84), same switch.
const USE_COMPLETION_MOTION = process.env.NEXT_PUBLIC_LEGACY_ONBOARDING !== "true";
const ENROLL_TIMEOUT_MS = 40_000;

/**
 * Step 3 of onboarding (CC-81, behind flag `onboarding_level_step`): the paper and combination/subject choice that the
 * "add subjects" modal used to ask after onboarding. Same data and same `selectedexam` call as that modal, in one pass
 * through onboarding instead of an extra screen. Content exists only on leaf nodes and leaves are alternatives, so the
 * student always picks ONE path down to a leaf.
 */
export default function LevelChoiceStep({ data, steps, currentStep, goBack }: StepProps) {
  const t = useTranslations("");
  const errorT = useTranslations("modals.buySingleCourseModal.error");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const invalidateMyCourses = useInvalidateQuery(MY_COURSES_KEY);

  const exam = data.exam;
  const { levels, loading, error } = useLevels(exam?.id);

  const [path, setPath] = useState<Level[]>([]);
  const [queries, setQueries] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<"network" | "generic" | null>(null);
  // Start is not ready until a leaf is picked; a tap on it says why (same pattern as CC-90).
  const [pickHint, setPickHint] = useState(false);
  // Synchronous double-tap guard: `submitting` only takes effect after a re-render, so two taps in the same frame
  // both got through and enrolled twice.
  const inFlightRef = useRef(false);

  // An exam with one paper has nothing to choose there: pick it (CC-111).
  useEffect(() => {
    if (levels.length > 0 && path.length === 0) setPath(initialPath(levels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels]);

  const trans = useMemo(
    () => new Map(levels.map((l) => [l.id, parseTranslation<LevelTranslation>(l.translation)])),
    [levels],
  );
  const nameOf = (l: Level) => trans.get(l.id)?.[locale]?.name ?? l.name ?? "";

  const complete = isPathComplete(levels, path);
  useEffect(() => {
    if (complete) setPickHint(false);
  }, [complete]);

  const select = (depth: number, item: Level) => {
    setPath((prev) => pathAfterSelect(prev, depth, item));
    setPickHint(false);
    setEnrollError(null);
  };

  const handleStart = async () => {
    if (!exam || submitting || inFlightRef.current) return;
    if (!complete) {
      setPickHint(true);
      return;
    }
    inFlightRef.current = true;
    setSubmitting(true);
    setEnrollError(null);

    const celebrate = USE_COMPLETION_MOTION;
    const fail = (kind: "network" | "generic", err?: unknown) => {
      if (celebrate) useOnboardingCelebrationStore.getState().cancel();
      setEnrollError(kind);
      if (kind === "generic") {
        logger.error(err ?? new Error("onboarding level step resolved without success"), {
          tags: { module: "onboarding", action: "enroll_with_levels" },
          extra: { examId: exam.id, ...(err instanceof ApiError ? err.toContext() : {}) },
        });
      } else {
        logger.breadcrumb("Onboarding level step hit a network failure", { tags: { module: "onboarding" } });
      }
    };

    try {
      const selections = { [Number(path[0].id)]: path.map((p) => Number(p.id)) };
      trackEvent("Onboarding Step Completed", {
        step_number: 3,
        step_name: "level_selection",
        exam_choice: exam.short_name,
        selected_navigation_ids: selections[Number(path[0].id)],
        selected_navigation_names: path.map(nameOf),
      });
      if (celebrate) {
        useOnboardingCelebrationStore.getState().start({
          languageCode: String(data.language ?? ""),
          examShortName: exam.short_name ?? "",
          examState: exam.state,
          examType: exam.exam_type,
        });
      }

      // A request chain that never answers must not trap the learner behind the animation.
      let giveUp: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        (async () => {
          // Exactly today's enrolment (trial row, dates), then exactly what the "add subjects" modal saves.
          const created = await enrolledToCourse({ exam_id: exam.id });
          if (!created.status) return null;
          return purchaseLevels({ exam_id: exam.id, selections });
        })(),
        new Promise<never>((_, reject) => {
          giveUp = setTimeout(() => reject(new TypeError("enrolment timed out: network")), ENROLL_TIMEOUT_MS);
        }),
      ]).finally(() => clearTimeout(giveUp));

      if (result?.status !== "success") {
        fail("generic");
        return;
      }

      trackEvent("Onboarding Completed", {
        entry_step_name: "language_selection",
        up_onboarding_status: "completed",
        up_chosen_exam_id: exam.short_name ?? "",
        up_preferred_app_language: data.language as AppLanguageCode,
      });
      await invalidateMyCourses().catch(() => {});
      await queryClient.invalidateQueries({ queryKey: LEVELS_QUERY_KEY(exam.id) }).catch(() => {});

      const groupCode: string = result.data.group_code;
      // Flag `practice_test` (phase 72): when on and not done yet, remember it was offered; the Preparation page
      // then asks (Take / Skip) before anything else, exactly as after the "add subjects" modal.
      if (await isPracticeTestEnabled(authUser?.uuid)) {
        const taken = await getCourseState(groupCode)
          .then((s) => s.practice_test_status === "completed")
          .catch(() => false);
        if (!taken) void offerPracticeTest(groupCode).catch(() => {});
      }

      if (celebrate) useOnboardingCelebrationStore.getState().markEnrolled();
      router.replace(`/preparation/${groupCode}?subject_selected=1`);
    } catch (err) {
      fail(isNetworkFailure(err) ? "network" : "generic", err);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const groups = groupsToShow(levels, path);
  const single = levels.filter((l) => l.parent_id === null).length === 1;

  return (
    <MainContainer maxWidth={"max-w-[850px]"} padding="md:pt-20">
      <div className="flex flex-col gap-2 pb-[110px] md:pb-0">
        <StepIndicatorCard
          data={steps}
          currentStep={currentStep}
          title={t("Onboarding.subject.select_subject")}
          titleHeightLight={t("Onboarding.subject.highlight_text")}
          description={t("Onboarding.subject.description")}
          goBack={goBack}
        />

        {error && <p className="text-sm text-red-500 px-4 bg-white py-3">{errorT("generic")}</p>}

        {loading ? (
          <div className="p-6 flex justify-center bg-white">
            <DotsLoader />
          </div>
        ) : (
          groups.map(({ depth, options }) => {
            // A single paper was picked for the student: no question to show at depth 0.
            if (depth === 0 && single) return null;
            const heading =
              depth === 0
                ? t("modals.buySingleCourseModal.paperSelection.selectPaperTitle", { exam: `${exam?.short_name ?? ""} Exam` })
                : (trans.get(options[0].id)?.[locale]?.group ?? "");
            const query = queries[depth] ?? "";
            const shown = filterOptions(options, query, nameOf, path[depth]?.id);
            return (
              <div key={depth} className="p-4 bg-white space-y-3">
                <div>
                  <p className="heading-medium !font-semibold">{heading}</p>
                  <p className="body-small !font-normal text-surface-gray-muted">
                    {t("modals.buySingleCourseModal.paperSelection.selectAnyOneOption")}
                  </p>
                </div>
                {options.length > SEARCH_MIN_OPTIONS && (
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQueries((q) => ({ ...q, [depth]: e.target.value }))}
                    placeholder={t("Onboarding.subject.search")}
                    aria-label={t("Onboarding.subject.search")}
                    className="h-10 !text-base"
                  />
                )}
                {shown.length === 0 ? (
                  <p role="status" className="body-small text-surface-gray-muted py-2">
                    {t("Onboarding.subject.noResults")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {shown.map((level) => {
                      const tr = trans.get(level.id)?.[locale];
                      return (
                        <OptionSelectionCard
                          key={level.id}
                          borderRadius={8}
                          selected={path[depth]?.id === level.id}
                          showIcon
                          onClick={() => select(depth, level)}
                          content={
                            <span className="flex flex-col items-start">
                              <span className="heading-small !font-semibold text-surface-gray-normal">{nameOf(level)}</span>
                              {depth === 0 && tr?.detail && (
                                <span className="body-small !font-normal text-surface-gray-muted">{tr.detail}</span>
                              )}
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static">
          <div className="flex flex-col gap-2 items-center">
            {enrollError && (
              <p role="alert" className="body-small text-center text-red-500 w-full max-w-[400px]">
                {errorT(enrollError)}
              </p>
            )}
            {/* The hint floats above the button (absolute), so showing it never moves the button. */}
            <div className="relative w-full">
              {pickHint && !complete && !enrollError && (
                <p role="status" className="absolute bottom-full left-0 right-0 pb-1 bg-white body-small !font-semibold text-center text-brand">
                  {t("Onboarding.pickOption")}
                </p>
              )}
              <MainButton
                text={t("modals.buySingleCourseModal.subjectSelection.startLearning")}
                fullWidth={true}
                disabled={submitting || loading}
                notReady={!complete}
                onNotReadyTap={() => setPickHint(true)}
                onClick={handleStart}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}
