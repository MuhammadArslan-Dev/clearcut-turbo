"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCourseHome } from "@/hooks/course/useCourseHome";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/useIsMobile";
import { useCourseStore } from "@/store/course/useCourseStore";
import { CustomModal } from "../../modals-bottom-sheet";
import StepIndicatorCard from "@/components/features/onboarding/indicator/StepIndicatorCard";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import ShimmerButton from "@/components/ui/button/shimmer-button";

import { useLevels } from "@/hooks/onboarding/useLevels";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";

import { OnboardingStep } from "@/types/onboarding/onboarding";
import { Level, LevelTranslation, purchaseLevels } from "@/lib/api/onboarding";
import { trackEvent } from "@/lib/analytics/browser";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { token } from "@/lib/auth-token-client";
import { parseTranslation } from "@/utils/text/translation";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { useRouter } from "@/i18n/navigation";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import { MY_COURSES_KEY } from "@/hooks/course/useMyActiveCourses";
import { ApiError, isNetworkFailure } from "@/lib/api/api-error";
import { logger } from "@/lib/sentry/sentry-logger";
import PracticeTestPromptSheet from "@/components/features/practice-test/PracticeTestPromptSheet";
import { getCourseState, offerPracticeTest, skipPracticeTest } from "@/lib/api/userState";
import { isPracticeTestEnabled } from "@/lib/experiments/practiceTestFlag";
import { useAuth } from "@/providers/AuthProvider";
import { useEnrollCelebrationStore } from "@/store/course/useEnrollCelebrationStore";
import { setupExperimentProps, useSetupFirst, useSetupFirstStore } from "@/components/features/setup-first/useSetupFirstStore";

/** Phase 122: how many subject groups sit under a paper (0 = the paper has no subject step). */
function groupDepth(levels: Level[], id: number | string): number {
  const kids = levels.filter((l) => l.parent_id === id);
  return kids.length ? 1 + Math.max(...kids.map((k) => groupDepth(levels, k.id))) : 0;
}

// Enrollment animation after "Start Learning" (phase 84). NEXT_PUBLIC_LEGACY_ENROLL_ANIMATION=true (and rebuild) restores the
// previous behaviour (button spinner, then straight to the next screen); nothing else needs to change.
const USE_ENROLL_MOTION = process.env.NEXT_PUBLIC_LEGACY_ENROLL_ANIMATION !== "true";
const ENROLL_TIMEOUT_MS = 40_000;

export default function BuySigleCourseModal() {
  const { isOpen, close, mode, data } = useCourseStore();
  const isMobile = useIsMobile();
  const modalT = useTranslations("modals.buySingleCourseModal");
  const { locale } = useLanguageSwitch();
  useDrawerBackHandler();
  const changeP = useTranslations("modals.changePaper");
  const invalidateMyCourses = useInvalidateQuery(MY_COURSES_KEY);

  const { levels: levelsRaw = [], loading, error } = useLevels(data?.id);

  const router = useRouter();
  const courseHome = useCourseHome();
  const { user } = useAuth();
  // Phase 122 ("finish setup" experiment): the variant UI only for an eligible learner in setup_first; the setup events
  // below are sent for everybody (both variants), with experiment_* only for a learner who is in the experiment.
  const setupFirst = useSetupFirst();
  const treatment = setupFirst.treatment;
  const setupT = useTranslations("modals.buySingleCourseModal.setup");
  const setupCtx = useCallback(
    () => ({
      exam_name: data?.short_name ?? "",
      setup_source: useSetupFirstStore.getState().source ?? "other",
      first_setup: useSetupFirstStore.getState().eligible,
      ...setupExperimentProps(),
    }),
    [data?.short_name],
  );
  const savedRef = useRef(false);

  /* ---------------------------------- state ---------------------------------- */
  const [step, setStep] = useState(0);
  const [paper, setPaper] = useState<Level | null>(null);
  const [selectedPath, setSelectedPath] = useState<Level[]>([]);
  const [finalSelection, setFinalSelection] = useState<Level | null>(null);
  const [currentParent, setCurrentParent] = useState<number | string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // CC-111: "Continue to Subjects" / "Start Learning" were tapped while still
  // disabled (no paper/subject picked) and nothing happened. A tap on the
  // disabled button now says what to do.
  const [showPickHint, setShowPickHint] = useState(false);
  // Set once the subjects are saved: the "take a practice test?" sheet is shown
  // (the picker is hidden meanwhile) and the choice decides where we go next.
  const [practicePrompt, setPracticePrompt] = useState<{ groupCode: string } | null>(null);

  /* ---------------------------------- container (STABLE) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);
  const transCache = useMemo(
    () =>
      new Map(
        levelsRaw.map((c) => [
          c.id,
          parseTranslation<LevelTranslation>(c.translation),
        ]),
      ),
    [levelsRaw],
  );

  /* ---------------------------------- memoized data ---------------------------------- */
  const parent = useMemo(
    () => levelsRaw.filter((item) => item.parent_id === null),
    [levelsRaw],
  );

  const childs = useMemo(
    () => levelsRaw.filter((item) => item.parent_id !== null),
    [levelsRaw],
  );

  const currentChildren = useMemo(() => {
    if (currentParent == null) return [];
    return levelsRaw.filter((item) => item.parent_id === currentParent);
  }, [levelsRaw, currentParent]);

  const STEPS: OnboardingStep[] = useMemo(
    () => [
      {
        id: "exam",
        title: modalT("paperSelection.title"),
        highlightText: modalT("paperSelection.highlight_text"),
        description: `${data?.short_name ?? ""} Exam`,
      },
      {
        id: "level",
        title: modalT("subjectSelection.title"),
        highlightText: modalT("subjectSelection.highlight_text"),
        description: `${data?.short_name ?? ""} Exam ${selectedPath[0]?.name ?? ""}`,
      },
    ],
    [data, modalT, selectedPath],
  );

  /* ---------------------------------- reset on close ---------------------------------- */
  const resetModalState = useCallback(() => {
    setStep(0);
    setPaper(null);
    setSelectedPath([]);
    setFinalSelection(null);
    setCurrentParent(null);
    setSubmitting(false);
    setPurchaseError(null);
    setShowPickHint(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  // An exam with a single paper has nothing to choose: pick it, so the
  // student isn't asked a question with one answer (CC-111).
  useEffect(() => {
    if (!isOpen || paper || parent.length !== 1) return;
    const only = parent[0];
    setPaper(only);
    setSelectedPath([only]);
    setCurrentParent(only.id);
  }, [isOpen, paper, parent]);

  // Phase 122: the sheet opened (both variants).
  const openedRef = useRef(false);
  useEffect(() => {
    if (!(isOpen && mode === "single" && data?.id)) {
      openedRef.current = false;
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;
    savedRef.current = false;
    // A kept paper with subjects reopens on the subject step (variant): label the step the learner actually sees.
    const kept = treatment ? useSetupFirstStore.getState().drafts[String(data.id)] : undefined;
    const onSubjects = !!kept?.paperHasSubjects;
    trackEvent("Exam Details Selection Started", {
      step_number: onSubjects ? 2 : 1,
      step_name: onSubjects ? "subject_selection" : "paper_selection",
      ...setupCtx(),
    });
  }, [isOpen, mode, data?.id, setupCtx, treatment]);

  // Phase 122 (variant): reopening brings back the paper / subjects picked before the sheet was closed.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      restoredRef.current = false;
      return;
    }
    if (!treatment || restoredRef.current || !data?.id || !levelsRaw.length) return;
    restoredRef.current = true;
    const draft = useSetupFirstStore.getState().drafts[String(data.id)];
    if (!draft) return;
    const path = draft.pathIds.map((id) => levelsRaw.find((l) => String(l.id) === String(id))).filter(Boolean) as Level[];
    if (!path.length) return;
    setPaper(path[0]);
    setSelectedPath(path);
    const last = path[path.length - 1];
    setCurrentParent(last.id);
    setFinalSelection(levelsRaw.some((l) => l.parent_id === last.id) ? null : last);
    if (draft.paperHasSubjects) setStep(1);
  }, [isOpen, treatment, data?.id, levelsRaw]);

  /** Phase 122: the learner closed the sheet without saving (X / back / backdrop / Do it later). */
  const dismiss = useCallback(
    (method: "close" | "back" | "do_it_later") => {
      if (!savedRef.current) {
        trackEvent("Setup Sheet Closed", {
          last_step: step === 0 ? "paper_selection" : "subject_selection",
          had_paper: !!paper,
          close_method: method,
          ...setupCtx(),
        });
        const store = useSetupFirstStore.getState();
        if (treatment && data?.id != null) {
          store.setDraft(
            data.id,
            paper
              ? {
                  paperId: paper.id,
                  paperName: transCache.get(paper.id)?.[locale]?.name ?? paper.name,
                  pathIds: selectedPath.map((l) => l.id),
                  paperHasSubjects: groupDepth(levelsRaw, paper.id) > 0,
                }
              : null,
          );
        }
        if (store.eligible) store.setDismissed(true);
      }
      close();
    },
    [step, paper, setupCtx, treatment, data?.id, transCache, locale, selectedPath, levelsRaw, close],
  );

  /* ---------------------------------- handlers ---------------------------------- */
  const handleEdit = useCallback(
    (replaceAtId: number | string, newItem: Level) => {
      setSelectedPath((prev) => {
        const index = prev.findIndex((p) => p.id === replaceAtId);
        if (index === -1) return prev;
        return [...prev.slice(0, index), newItem];
      });

      setCurrentParent(newItem.id);
      setFinalSelection(null);
    },
    [],
  );

  const handleSelect = useCallback(
    (item: Level) => {
      if (item.parent_id === null) {
        setSelectedPath([item]);
      } else {
        setSelectedPath((prev) =>
          prev.some((p) => p.id === item.id) ? prev : [...prev, item],
        );
      }

      setCurrentParent(item.id);
      setShowPickHint(false);

      const nextChildren = levelsRaw.filter((d) => d.parent_id === item.id);
      setFinalSelection(nextChildren.length === 0 ? item : null);
    },
    [levelsRaw],
  );

  const handlePurchase = useCallback(async () => {
    if (!data?.id || !selectedPath.length || submitting) return;

    const selections = {
      [Number(selectedPath[0].id)]: selectedPath.map((item) => Number(item.id)),
    };

    const selectionNames = selectedPath.map((item) => item.name);

    setSubmitting(true);
    setPurchaseError(null);

    // The animation starts NOW (the learner sees the tap was taken) while the request runs; it cannot finish before the
    // request succeeds, and a failure removes it again so the error below is visible on the sheet.
    const celebrate = USE_ENROLL_MOTION;
    const enrollStore = useEnrollCelebrationStore.getState();
    if (celebrate) {
      // Desktop: hand the modal panel's size to the animation frame so it takes over without a visible jump.
      const panelEl = contentRef.current?.closest(".shadow-xl") as HTMLElement | null;
      const box = !isMobile ? panelEl?.getBoundingClientRect() : undefined;
      enrollStore.start({
        panel: box ? { width: box.width, height: box.height } : undefined,
        exam: `${data.short_name ?? ""} Exam`,
        selection: selectedPath.map((item, i) => {
          const tr = transCache.get(item.id)?.[locale];
          return { title: tr?.name ?? item.name, subtitle: i === 0 ? tr?.detail : undefined };
        }),
      });
    }
    try {
      // A request that never answers must not trap the learner behind the animation.
      let giveUp: ReturnType<typeof setTimeout> | undefined;
      const req = await Promise.race([
        purchaseLevels({
          exam_id: data.id,
          selections,
        }),
        new Promise<never>((_, reject) => {
          giveUp = setTimeout(() => reject(new TypeError("enrolment timed out: network")), ENROLL_TIMEOUT_MS);
        }),
      ]).finally(() => clearTimeout(giveUp));

      if (req?.status === "success") {
        await trackEvent("New Exam Added", {
          exam_name: data.short_name!,
          source: "my_courses_dropdown",
          selected_paper_ids: [selectedPath[0].id],
          selected_paper_names: [selectedPath[0].name],
          selected_navigation_ids: selections[Number(selectedPath[0].id)],
          selected_navigation_names: selectionNames,
          setup_source: useSetupFirstStore.getState().source ?? "other",
          first_setup: useSetupFirstStore.getState().eligible,
          ...(() => {
            const at = useSetupFirstStore.getState().enrolledAt;
            const ms = at != null ? Date.parse(String(at)) : NaN;
            return Number.isFinite(ms) ? { time_since_enrolment_s: Math.max(0, Math.round((Date.now() - ms) / 1000)) } : {};
          })(),
          ...setupExperimentProps(),
        });
        savedRef.current = true;
        if (data?.id != null) useSetupFirstStore.getState().setDraft(data.id, null);
        await invalidateMyCourses();
        // First time this course gets subjects (this modal only opens for a
        // course without them, or a newly added exam): ask whether to take the
        // short practice test first (see PracticeTestPromptSheet). Either way
        // the next URL carries the `subject_selected` marker, which
        // FacebookPixel consumes on any route.
        // Not offered again for a course whose practice test is already done
        // (kept on the backend per user + course, so it holds across devices).
        // If that can't be read, offer it: it is skippable and harmless.
        const groupCode: string = req.data.group_code;
        // Amplitude flag `practice_test` (phase 72): OFF, not confirmed within
        // 1.5 s or any failure -> no sheet, and no `offered` state is written,
        // straight to Preparation.
        const practiceTestOn = await isPracticeTestEnabled(user?.uuid);
        if (!practiceTestOn) {
          close();
          if (celebrate) enrollStore.markEnrolled("/preparation");
          router.push(courseHome(groupCode, "subject_selected=1"));
          return;
        }
        const alreadyTaken = await getCourseState(groupCode)
          .then((state) => state.practice_test_status === "completed")
          .catch(() => false);
        if (alreadyTaken) {
          close();
          if (celebrate) enrollStore.markEnrolled("/preparation");
          router.push(courseHome(groupCode, "subject_selected=1"));
          return;
        }
        // Remember that it was shown: if the learner leaves before answering
        // (refresh, closed tab), the Preparation page offers it again.
        void offerPracticeTest(groupCode).catch(() => {});
        setPracticePrompt({ groupCode });
        // No navigation here: the practice-test sheet opens under the animation and is revealed when the curtain lifts.
        if (celebrate) enrollStore.markEnrolled();
        return;
      }

      // Resolved without throwing but wasn't a success status either — was
      // previously silent (no error shown, no report), so a user hitting
      // this had no idea their submission didn't go through.
      if (celebrate) enrollStore.cancel();
      setPurchaseError(modalT("error.generic"));
      logger.error(new Error("purchaseLevels resolved without success"), {
        tags: { module: "buy-single-course-modal", action: "handlePurchase" },
        extra: { examId: data.id, status: req?.status },
      });
    } catch (err) {
      if (celebrate) enrollStore.cancel();
      // A retry-exhausted mobile network blip (Instagram/Facebook in-app
      // browsers, same recurring pattern as Sentry CLEARCUTOFF-NEXTJS-APP-74
      // /-2T) isn't actionable on our end — still shown to the user (they're
      // actively waiting on this submit, unlike a background sync), but kept
      // out of the Sentry issue stream as a breadcrumb instead of an error.
      // A genuine backend failure (4xx/5xx) is still reported as an error.
      if (isNetworkFailure(err)) {
        setPurchaseError(modalT("error.network"));
        logger.breadcrumb("New exam purchase hit a network blip", {
          tags: { module: "buy-single-course-modal" },
          extra: { examId: data.id },
        });
      } else {
        setPurchaseError(modalT("error.generic"));
        logger.error(err, {
          tags: { module: "buy-single-course-modal", action: "handlePurchase" },
          extra: {
            examId: data.id,
            ...(err instanceof ApiError ? err.toContext() : {}),
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [data?.id, data?.short_name, selectedPath, submitting, modalT, user?.uuid, transCache, locale, isMobile]);

  /** Phase 122: one step of the sheet done (both variants). */
  const trackStepDone = useCallback(
    (which: "paper_selection" | "subject_selection") => {
      const names = selectedPath.map((l) => transCache.get(l.id)?.["en"]?.name ?? l.name);
      trackEvent("Exam Details Selection Completed", {
        step_number: which === "paper_selection" ? 1 : 2,
        step_name: which,
        paper_choice: names[0] ?? "",
        ...(which === "subject_selection" ? { subject_combination_choice: names.slice(1).join(" + ") } : {}),
        ...setupCtx(),
      });
    },
    [selectedPath, transCache, setupCtx],
  );

  const continueFromPrompt = useCallback(
    (path: "practice-test" | "preparation") => {
      if (!practicePrompt) return;
      const groupCode = practicePrompt.groupCode;
      setPracticePrompt(null);
      // Remember the choice on the backend (best effort; never blocks the learner).
      if (path === "preparation") void skipPracticeTest(groupCode).catch(() => {});
      close();
      router.push(`/${path}/${groupCode}?subject_selected=1`);
    },
    [practicePrompt, close, router],
  );

  const { buttonPhase } = useButtonArrowAnimation({
    data: currentChildren.length === 0,
  });

  const { buttonPhase: nextButtonPhase } = useButtonArrowAnimation({
    data: paper !== null,
  });

  // Phase 122 (variant): honest step count (a paper without subjects = 1 step), "x of n chosen", the missing group's name.
  const subjectGroups = paper ? groupDepth(levelsRaw, paper.id) : 0;
  const stepsShown = treatment && paper && subjectGroups === 0 ? STEPS.slice(0, 1) : STEPS;
  const chosenGroups = Math.max(0, selectedPath.length - 1);
  const groupTitle = (group: string | undefined, index: number) => {
    if (!treatment || !group) return group;
    const name = index > 1 && /optional/i.test(group) ? setupT("secondSubject") : group;
    // One subject group: the prototype says "Pick your subject" instead of the data's group name ("Optional subject").
    return subjectGroups > 1 ? setupT("groupHeading", { index, total: subjectGroups, group: name }) : setupT("pickSubject");
  };
  const nextGroupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!treatment || step !== 1 || selectedPath.length < 2) return;
    const el = nextGroupRef.current;
    if (el?.scrollIntoView) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }, [treatment, step, currentParent, selectedPath.length]);

  /* ---------------------------------- render ---------------------------------- */
  const mainContent = () => {
    return (
      <div ref={contentRef} className="flex flex-col gap-3 h-full bg-gray-100 ">
        <div className="sticky top-0 z-50 bg-white">
          <StepIndicatorCard
            data={stepsShown}
            currentStep={step}
            title={STEPS[step].title}
            titleHeightLight={STEPS[step].highlightText}
            description={STEPS[step].description}
            goBack={step === 0 ? () => dismiss("back") : () => { setShowPickHint(false); setStep(step - 1); }}
          />
        </div>

        {step === 0 && (
          <motion.div
            className=" md:px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4 md:rounded-md">
              <div>
                <p className="heading-medium !font-semibold">
                  {modalT("paperSelection.selectPaperTitle", {
                    exam: data?.short_name + " Exam",
                  })}
                </p>
                <p className="body-xsmall !font-normal text-surface-gray-muted">
                  {modalT("paperSelection.selectPaperSubtitle")}
                </p>
              </div>

              {error && <p>Sorry something went wrong</p>}

              {loading ? (
                <div className="p-4 flex justify-center">
                  <DotsLoader />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parent.map((item) => {
                    const trans = transCache.get(item?.id)?.[locale];

                    return (
                      <OptionSelectionCard
                        key={item.id}
                        padding="12px 20px"
                        borderRadius={8}
                        selected={paper?.id === item.id}
                        showIcon
                        onClick={() => {
                          setPaper(item);
                          setSelectedPath([item]);
                          setCurrentParent(item.id);
                          setShowPickHint(false);
                        }}
                        content={
                          <span className="flex flex-col items-start">
                            <h6 className="heading-small !font-semibold text-surface-gray-normal">
                              {trans?.name}
                            </h6>
                            <p className="body-small !font-normal text-surface-gray-muted">
                              {trans?.detail}
                            </p>
                          </span>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            className="md:px-4 pb-[92px] md:pb-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            {" "}
            {selectedPath.map((item, index) => {
              const levels = childs.filter((l) => l.parent_id === item.id);
              const nextSelected = selectedPath[index + 1];

              if (!nextSelected || !levels.length) return null;

              const data = transCache.get(levels[0].id)?.[locale];

              return (
                <div
                  key={item.id}
                  className="flex-1 p-4 bg-white space-y-4  md:rounded-md"
                >
                  <div>
                    <p className="heading-medium !font-semibold">
                      {groupTitle(data?.group, index + 1)}
                    </p>
                    <p className="body-medium !font-normal text-surface-gray-muted">
                      {modalT("paperSelection.selectAnyOneOption")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {levels.map((level) => {
                      const data = transCache.get(level?.id)?.[locale];

                      return (
                        <OptionSelectionCard
                          key={level.id}
                          borderRadius={8}
                          selected={level.id === nextSelected.id}
                          showIcon
                          onClick={() => handleEdit(nextSelected.id, level)}
                          content={<p>{data?.name}</p>}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {currentChildren.length > 0 && (
              <div ref={nextGroupRef} className="flex-1 p-4 bg-white space-y-4  md:rounded-md">
                <div>
                  <p className="heading-medium !font-semibold">
                    {groupTitle(transCache.get(currentChildren[0]?.id)?.[locale]?.group, selectedPath.length)}
                  </p>
                  <p className="body-medium !font-normal text-surface-gray-muted">
                    {modalT("paperSelection.selectAnyOneOption")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentChildren.map((level) => {
                    const data = transCache.get(level.id)?.[locale];

                    return (
                      <OptionSelectionCard
                        key={level.id}
                        borderRadius={8}
                        showIcon
                        onClick={() => handleSelect(level)}
                        content={<p>{data?.name}</p>}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="p-4 fixed md:sticky bottom-0 w-full right-0 bg-white flex flex-col items-center gap-2">
          {purchaseError && (
            <p className="body-small text-center text-red-500 w-full max-w-[400px]">
              {purchaseError}
              {treatment && <span className="block text-surface-gray-muted">{setupT("keptOnError")}</span>}
            </p>
          )}
          {treatment && step === 1 && subjectGroups > 1 && (
            <p className="body-small !font-semibold text-center text-surface-gray-subtle" data-testid="setup-chosen-count">
              {setupT("chosen", { done: Math.min(chosenGroups, subjectGroups), total: subjectGroups })}
            </p>
          )}
          {showPickHint && !purchaseError && (
            <p role="status" className="body-small !font-semibold text-center text-brand w-full max-w-[400px]">
              {!treatment
                ? modalT("paperSelection.selectAnyOneOption")
                : step === 0
                  ? setupT("pickPaper")
                  : subjectGroups > 1
                    ? setupT("pickGroup", { group: groupTitle(transCache.get(currentChildren[0]?.id)?.[locale]?.group, selectedPath.length) ?? "" })
                    : setupT("pickSubjectHint")}
            </p>
          )}
          {step === 0 ? (
            <div className="relative w-full max-w-[400px]">
              <ShimmerButton
                text={
                  treatment && !paper
                    ? setupT("continue")
                    : currentChildren.length > 0
                      ? modalT("paperSelection.continue")
                      : modalT("subjectSelection.startLearning")
                }
                disabled={!paper}
                loading={submitting}
                shimmer={nextButtonPhase === "shimmer"}
                onClick={() => {
                  setShowPickHint(false);
                  if (!submitting) trackStepDone("paper_selection");
                  currentChildren.length > 0 ? setStep(1) : handlePurchase();
                }}
                icon={
                  <motion.span
                    animate={nextButtonPhase === "icon" ? { x: 6 } : { x: 0 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <ChevronDoubleRightIcon strokeWidth={3} width={16} />
                  </motion.span>
                }
                iconPosition="right"
              />
              {!paper && (
                // A disabled <button> swallows the tap, so this layer catches it.
                <button
                  type="button"
                  aria-label={modalT("paperSelection.selectAnyOneOption")}
                  onClick={() => setShowPickHint(true)}
                  className="absolute inset-0 cursor-pointer rounded-full"
                />
              )}
            </div>
          ) : (
            <div className="relative w-full max-w-[400px]">
              <ShimmerButton
                text={modalT("subjectSelection.startLearning")}
                disabled={currentChildren.length > 0}
                shimmer={buttonPhase === "shimmer"}
                loading={submitting}
                onClick={() => {
                  if (!submitting) trackStepDone("subject_selection");
                  handlePurchase();
                }}
                icon={
                  <motion.span
                    animate={buttonPhase === "icon" ? { x: 6 } : { x: 0 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <ChevronDoubleRightIcon strokeWidth={3} width={16} />
                  </motion.span>
                }
                iconPosition="right"
              />
              {currentChildren.length > 0 && (
                <button
                  type="button"
                  aria-label={modalT("paperSelection.selectAnyOneOption")}
                  onClick={() => setShowPickHint(true)}
                  className="absolute inset-0 cursor-pointer rounded-full"
                />
              )}
            </div>
          )}
          {treatment && (
            <button
              type="button"
              onClick={() => dismiss("do_it_later")}
              className="body-small text-surface-gray-subtle underline"
              data-testid="setup-do-it-later"
            >
              {setupT("doItLater")}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && mode === "single" && !practicePrompt && (
          <Container
            maxWidth="max-w-[720px] rounded-md"
            isHeader={false}
            isOpen={isOpen}
            onClose={() => dismiss("close")}
          >
            {mainContent()}
          </Container>
        )}
      </AnimatePresence>
      <PracticeTestPromptSheet
        isOpen={isOpen && mode === "single" && practicePrompt !== null}
        courseCode={practicePrompt?.groupCode}
        onTake={() => continueFromPrompt("practice-test")}
        onSkip={() => continueFromPrompt("preparation")}
      />
    </>
  );
}
