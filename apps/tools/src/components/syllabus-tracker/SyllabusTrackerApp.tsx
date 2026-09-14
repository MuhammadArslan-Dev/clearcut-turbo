"use client";

import { useEffect, useState } from "react";
import Text from "@clearcut/ui/text";
import Skeleton from "@clearcut/ui/skeleton";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import {
  getTrackerState,
  saveTrackerState,
  resetTrackerState,
  SyllabusTrackerState,
} from "@/lib/syllabusTracker";
import { fetchSyllabusTree, SyllabusExam, SyllabusLevel } from "@/lib/api/syllabusApi";
import { slugify, levelSlug, readSlugFromLocation, pushSyllabusUrl, replaceSyllabusUrl } from "@/lib/syllabusTrackerUrl";
import ExamPickerStep from "./ExamPickerStep";
import LevelPickerStep, { SelectedLevel } from "./LevelPickerStep";
import TrackerDashboard from "./TrackerDashboard";
import Stepper from "./Stepper";
import ConfirmDialog from "./ConfirmDialog";

type Step = "loading" | "exam" | "level" | "dashboard";

export default function SyllabusTrackerApp({ locale = "en" }: { locale?: Locale }) {
  const t = getSyllabusStrings(locale);
  const [step, setStep] = useState<Step>("loading");
  const [exam, setExam] = useState<SyllabusExam | null>(null);
  const [level, setLevel] = useState<SelectedLevel | null>(null);
  const [state, setState] = useState<SyllabusTrackerState | null>(null);

  // Slugs pulled from the URL on mount, handed to the exam/level pickers as
  // "auto-select this once you've loaded" — see src/lib/syllabusTrackerUrl.ts
  // for why this is parsed from window.location rather than Next's router.
  const [pendingExamSlug, setPendingExamSlug] = useState<string | undefined>();
  // Every URL segment after the exam — REET-style exams nest a level inside
  // a level (Paper -> language-subject choice -> optional-subject choice),
  // so this can be more than one slug; LevelPickerStep walks it one depth
  // at a time. See its own module comment for the drill-down mechanics.
  const [pendingLevelPath, setPendingLevelPath] = useState<string[] | undefined>();

  const [resetOpen, setResetOpen] = useState(false);
  // Set while the full syllabus tree is being fetched right after a level is
  // chosen — there's no separate "customize what you're tracking" step
  // anymore (every chapter is tracked by default), just a brief load before
  // the dashboard itself appears.
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [trackerLoadError, setTrackerLoadError] = useState(false);

  // Derives the whole wizard's state from whatever window.location currently
  // shows — used both on first mount and on a browser back/forward press
  // (popstate). Never triggers a network request either way: this is a pure
  // client-side re-derivation, which is also why a nested URL like
  // /syllabus-tracker/htet never needs to be a real, separately-loadable
  // Next route (see the comment atop app/syllabus-tracker/page.tsx).
  const restoreFromLocation = () => {
    const slugArr = readSlugFromLocation(locale);
    const saved = getTrackerState();
    const hasSaved = Boolean(saved.exam && saved.level && Object.keys(saved.subjects).length > 0);

    if (slugArr.length === 0) {
      setExam(null);
      setLevel(null);
      setPendingExamSlug(undefined);
      setPendingLevelPath(undefined);
      if (hasSaved && saved.exam && saved.level) {
        setState(saved);
        setStep("dashboard");
        replaceSyllabusUrl(locale, slugify(saved.exam.shortName), levelSlug(saved.level));
      } else {
        setState(null);
        setStep("exam");
      }
      return;
    }

    const [examSlugFromUrl, ...levelPathFromUrl] = slugArr;
    // Only the LEAF of a nested drill (Paper -> subject -> optional-subject)
    // is ever saved as `saved.level`, so a URL matches saved state when its
    // last segment is that leaf — the intermediate segments aren't
    // independently re-validated here.
    if (
      hasSaved &&
      saved.exam &&
      saved.level &&
      slugify(saved.exam.shortName) === examSlugFromUrl &&
      (levelPathFromUrl.length === 0 || levelPathFromUrl[levelPathFromUrl.length - 1] === levelSlug(saved.level))
    ) {
      setState(saved);
      setStep("dashboard");
      replaceSyllabusUrl(locale, examSlugFromUrl, levelSlug(saved.level));
      return;
    }

    // URL points at an exam/level combo that doesn't match what's saved (or
    // nothing is saved yet) — drive the picker steps and let them
    // auto-select as soon as their own data loads.
    setState(null);
    setExam(null);
    setLevel(null);
    setPendingExamSlug(examSlugFromUrl);
    setPendingLevelPath(levelPathFromUrl.length ? levelPathFromUrl : undefined);
    setStep("exam");
  };

  // A real browser back/forward press re-derives everything from the new
  // URL via the same logic as the initial mount, rather than hand-rolling a
  // second state-diffing path. In-app "Back" buttons and step transitions
  // below call replace/pushSyllabusUrl directly instead, so those stay
  // instant without going through this at all.
  useEffect(() => {
    window.addEventListener("popstate", restoreFromLocation);
    return () => window.removeEventListener("popstate", restoreFromLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    restoreFromLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExamSelect = (selectedExam: SyllabusExam) => {
    setExam(selectedExam);
    setStep("level");
    pushSyllabusUrl(locale, slugify(selectedExam.short_name));
  };

  const handleExamInvalidSlug = () => {
    setPendingExamSlug(undefined);
    setPendingLevelPath(undefined);
    replaceSyllabusUrl(locale);
  };

  const handleLevelSelect = (selectedLevel: SelectedLevel, path: SyllabusLevel[]) => {
    if (!exam) return;
    setLevel(selectedLevel);
    setStep("dashboard");
    const levelSegments = selectedLevel.id === "full-exam" ? ["full-exam"] : path.map(levelSlug);
    pushSyllabusUrl(locale, slugify(exam.short_name), ...levelSegments);
    setPendingLevelPath(undefined);
    loadFullTracker(exam, selectedLevel);
  };

  const handleLevelInvalidSlug = () => {
    setPendingLevelPath(undefined);
    if (exam) replaceSyllabusUrl(locale, slugify(exam.short_name));
  };

  // Every chapter in the fetched tree is tracked by default — there's no
  // customize/deselect step anymore — so this just reshapes the syllabus
  // API's response into tracker state and saves it.
  const loadFullTracker = (forExam: SyllabusExam, forLevel: SelectedLevel) => {
    setLoadingTracker(true);
    setTrackerLoadError(false);
    fetchSyllabusTree(forExam.id, forLevel.id)
      .then((tree) => {
        const subjects: SyllabusTrackerState["subjects"] = {};
        for (const [subject, chapters] of Object.entries(tree)) {
          if (chapters.length === 0) continue;
          subjects[subject] = chapters.map((c) => ({ id: c.id, name: c.name, completed: false, revisedAt: null }));
        }

        const next: SyllabusTrackerState = {
          version: 1,
          exam: { id: forExam.id, shortName: forExam.short_name, name: forExam.name },
          level: { id: forLevel.id, name: forLevel.name },
          subjects,
        };

        saveTrackerState(next);
        setState(next);
      })
      .catch(() => setTrackerLoadError(true))
      .finally(() => setLoadingTracker(false));
  };

  const updateState = (updater: (prev: SyllabusTrackerState) => SyllabusTrackerState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveTrackerState(next);
      return next;
    });
  };

  const handleToggleChapter = (subject: string, chapterId: number) => {
    updateState((prev) => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subject]: prev.subjects[subject].map((c) =>
          c.id === chapterId ? { ...c, completed: !c.completed } : c,
        ),
      },
    }));
  };

  const handleReset = () => {
    resetTrackerState();
    setState(null);
    setExam(null);
    setLevel(null);
    setStep("exam");
    replaceSyllabusUrl(locale);
    setResetOpen(false);
  };

  const handleBackToExam = () => {
    setStep("exam");
    replaceSyllabusUrl(locale);
  };

  const handleTrackDifferentExam = () => {
    setExam(null);
    setLevel(null);
    setStep("exam");
    replaceSyllabusUrl(locale);
  };

  if (step === "loading") return null;

  return (
    <div id="syllabus-tracker-app" className="max-w-[1080px] mx-auto px-3 pt-6 sm:py-6">
      <Stepper step={step} locale={locale} />

      {step === "exam" && (
        <ExamPickerStep
          onSelect={handleExamSelect}
          autoSelectSlug={pendingExamSlug}
          onInvalidSlug={handleExamInvalidSlug}
          locale={locale}
        />
      )}

      {step === "level" && exam && (
        <LevelPickerStep
          exam={exam}
          onSelect={handleLevelSelect}
          onBack={handleBackToExam}
          autoSelectPath={pendingLevelPath}
          onInvalidSlug={handleLevelInvalidSlug}
          locale={locale}
        />
      )}

      {step === "dashboard" && (
        <div className="cc-step-in">
          {loadingTracker || (!state && !trackerLoadError) ? (
            <div className="flex flex-col gap-4">
              <Skeleton variant="rectangular" width="100%" height={96} borderRadius={16} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width="100%" height={180} borderRadius={16} />
                ))}
              </div>
            </div>
          ) : trackerLoadError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] py-14 text-center">
              <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
                {t.syllabusLoadError}
              </Text>
              <button
                type="button"
                onClick={() => exam && level && loadFullTracker(exam, level)}
                className="text-sm font-medium text-brand hover:underline"
              >
                {t.tryAgain}
              </button>
            </div>
          ) : (
            state && (
              <TrackerDashboard
                state={state}
                onToggleChapter={handleToggleChapter}
                onReset={() => setResetOpen(true)}
                onTrackDifferentExam={handleTrackDifferentExam}
                locale={locale}
              />
            )
          )}
        </div>
      )}

      {!exam && !level && step === "exam" && state === null && !pendingExamSlug && (
        <Text as="p" variant="body-small" color="gray-muted" className="mt-8 text-center">
          {t.progressSavedNote}
        </Text>
      )}

      <ConfirmDialog
        open={resetOpen}
        title={t.resetConfirmTitle}
        description={t.resetConfirmDescription}
        confirmLabel={t.resetConfirmLabel}
        cancelLabel={t.resetCancelLabel}
        danger
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
