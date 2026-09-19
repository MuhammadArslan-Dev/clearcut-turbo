"use client";

import { useEffect, useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import Skeleton from "@clearcut/ui/skeleton";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import {
  getAllTrackedExams,
  getTrackedExamsByExamId,
  upsertTrackedExam,
  removeTrackedExam,
  updateTrackedExamSubjects,
  replaceAllTrackedExams,
  findCrossExamCompletion,
  propagateSubjectCompletion,
  TrackedExamEntry,
  TrackedPaper,
} from "@/lib/syllabusTracker";
import { fetchSyllabusLevels, fetchSyllabusTree, SyllabusExam, SyllabusLevel } from "@/lib/api/syllabusApi";
import { slugify, levelSlug, readSlugFromLocation, pushSyllabusUrl, replaceSyllabusUrl } from "@/lib/syllabusTrackerUrl";
import ExamPickerStep from "./ExamPickerStep";
import PaperPickerStep from "./PaperPickerStep";
import LevelPickerStep, { SelectedLevel } from "./LevelPickerStep";
import TrackerDashboard from "./TrackerDashboard";
import TrackedExamsList from "./TrackedExamsList";
import Stepper from "./Stepper";
import ConfirmDialog from "./ConfirmDialog";

type Step = "loading" | "list" | "exam" | "level" | "dashboard";
// A minimal exam shape good enough for the wizard steps below (id + display
// name) — the "Add Paper" flow re-enters the wizard for an exam that's
// already tracked, where all we have on hand is a TrackedExam, not the full
// SyllabusExam the picker grid returns. Every full SyllabusExam still
// satisfies this structurally, so no conversion is needed at the other call
// sites.
type WizardExam = Pick<SyllabusExam, "id" | "short_name" | "name" | "logo_url" | "exam_type">;

export default function SyllabusTrackerApp({ locale = "en" }: { locale?: Locale }) {
  const t = getSyllabusStrings(locale);
  const [step, setStep] = useState<Step>("loading");
  const [exam, setExam] = useState<WizardExam | null>(null);
  // The exam's full level tree, fetched once right after an exam is picked —
  // both to decide whether to show the Paper step (root nodes with
  // group==="Paper", confirmed against CTET's real API response) and to
  // hand to PaperPickerStep/LevelPickerStep so neither re-fetches it.
  // null = fetch in flight, undefined = fetch failed (LevelPickerStep falls
  // back to fetching it itself, including its own error/retry UI).
  const [examLevels, setExamLevels] = useState<SyllabusLevel[] | null | undefined>(null);
  // The paper chosen this wizard run, once past the Paper step — stays null
  // for exams with no Paper tier. Cleared (not the step) when going "back"
  // from the level step to the paper step, since both live under the same
  // internal `step === "level"` phase — see the render block below.
  const [paper, setPaper] = useState<TrackedPaper | null>(null);
  const [level, setLevel] = useState<SelectedLevel | null>(null);
  // Set only for the "Add Paper" flow — the paper ids this exam already
  // tracks, hidden from PaperPickerStep so the user can't re-pick one.
  const [addPaperExcludeIds, setAddPaperExcludeIds] = useState<number[] | undefined>(undefined);
  // The tracked exam entry currently open on the dashboard — set either
  // right after a fresh wizard run (loadFullTracker) or by opening an
  // already-tracked exam/paper from the list/a deep link.
  const [state, setState] = useState<TrackedExamEntry | null>(null);
  // Every exam/paper the user currently tracks — drives the "list" step and
  // the exam picker's excludeExamIds (Add More Exam). Re-read from storage
  // whenever it can change (mount, popstate, upsert/remove/toggle).
  const [trackedExams, setTrackedExams] = useState<TrackedExamEntry[]>([]);

  const hasPaperTier = useMemo(
    () => (examLevels ?? []).some((l) => l.parent_id === null && l.group === "Paper"),
    [examLevels],
  );

  // Slugs pulled from the URL on mount, handed to the exam/paper/level
  // pickers as "auto-select this once you've loaded" — see
  // src/lib/syllabusTrackerUrl.ts for why this is parsed from
  // window.location rather than Next's router.
  const [pendingExamSlug, setPendingExamSlug] = useState<string | undefined>();
  // Every URL segment after the exam — for a Paper-tier exam the FIRST of
  // these is the paper slug (e.g. ["paper-1", "english-and-hindi"]); for
  // everything else it's handed to LevelPickerStep as-is. REET-style exams
  // also nest a level inside a level (language-subject -> optional-subject),
  // so this can be more than one slug either way — each picker walks it one
  // depth at a time. See LevelPickerStep's own module comment for the
  // drill-down mechanics.
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
    const allTracked = getAllTrackedExams();
    setTrackedExams(allTracked);

    const resetWizardState = () => {
      setExam(null);
      setExamLevels(null);
      setPaper(null);
      setLevel(null);
      setAddPaperExcludeIds(undefined);
    };

    if (slugArr.length === 0) {
      resetWizardState();
      setPendingExamSlug(undefined);
      setPendingLevelPath(undefined);
      setState(null);
      // Returning user (>=1 tracked exam/paper): show the tracked-exams list
      // instead of dropping straight into a wizard or a single dashboard.
      setStep(allTracked.length > 0 ? "list" : "exam");
      return;
    }

    const [examSlugFromUrl, ...levelPathFromUrl] = slugArr;
    // A Paper-tracking exam can have more than one tracked entry sharing the
    // same exam slug, so matching also has to account for the paper slug
    // (the URL's first level-path segment) before falling back to the
    // leaf-level check every entry already needs.
    const matched = allTracked.find((e) => {
      if (slugify(e.exam.shortName) !== examSlugFromUrl) return false;
      if (e.paper) {
        return (
          levelPathFromUrl[0] === levelSlug(e.paper) &&
          (levelPathFromUrl.length <= 1 || levelPathFromUrl[levelPathFromUrl.length - 1] === levelSlug(e.level))
        );
      }
      return levelPathFromUrl.length === 0 || levelPathFromUrl[levelPathFromUrl.length - 1] === levelSlug(e.level);
    });
    if (matched) {
      resetWizardState();
      setState(matched);
      setStep("dashboard");
      // Prefer the incoming URL's own segments over reconstructing a
      // shorthand from just `matched.paper`/`matched.level` — a
      // TrackedExamEntry only ever stores the paper (root) and the final
      // leaf level, never the intermediate subject-group nodes drilled
      // through to reach it (e.g. UPTET Paper 2's "Hindi and English"
      // before "Maths and Science"). Reconstructing from those two alone
      // silently collapsed a freshly-completed wizard's full descriptive
      // URL (.../paper-2/hindi-and-english/maths-and-science) down to a
      // shorter one (.../paper-2/maths-and-science) the moment the page
      // restored from that same URL — so the URL a user just finished on,
      // and the URL a reload or shared link of it settles back to, didn't
      // match. levelPathFromUrl is already known valid here (the match
      // above confirmed its first/last segments), so just keep it.
      const segments = levelPathFromUrl.length
        ? levelPathFromUrl
        : matched.paper
          ? [levelSlug(matched.paper), levelSlug(matched.level)]
          : [levelSlug(matched.level)];
      replaceSyllabusUrl(locale, examSlugFromUrl, ...segments);
      return;
    }

    // URL points at an exam/paper/level combo that isn't already tracked (or
    // a different level than the one already tracked for that exam) — drive
    // the picker steps and let them auto-select as soon as their own data
    // loads.
    setState(null);
    resetWizardState();
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

  // Fetches one exam's level tree once, right after it's picked (or right
  // before re-entering the wizard for Add Paper) — both PaperPickerStep and
  // LevelPickerStep are handed the result instead of fetching their own
  // copy. A failure just leaves examLevels undefined; LevelPickerStep falls
  // back to fetching (and error/retry-ing) the same data itself, so this
  // never hard-fails the flow, it just skips the Paper-tier detection for
  // that attempt.
  const loadExamLevels = (examId: number) => {
    setExamLevels(null);
    fetchSyllabusLevels(examId, locale)
      .then((levels) => setExamLevels(levels))
      .catch(() => setExamLevels(undefined));
  };

  const handleExamSelect = (selectedExam: SyllabusExam) => {
    setExam(selectedExam);
    setPaper(null);
    setAddPaperExcludeIds(undefined);
    setStep("level");
    pushSyllabusUrl(locale, slugify(selectedExam.short_name));
    loadExamLevels(selectedExam.id);
  };

  const handleExamInvalidSlug = () => {
    setPendingExamSlug(undefined);
    setPendingLevelPath(undefined);
    replaceSyllabusUrl(locale);
  };

  // Selecting a paper (or the synthetic "track everything" shortcut, exactly
  // like LevelPickerStep's own full-exam option) from PaperPickerStep.
  const handlePaperSelect = (selected: SyllabusLevel | "full-exam") => {
    if (!exam) return;
    if (selected === "full-exam") {
      handleLevelSelect({ id: "full-exam", name: t.fullExamTitle(exam.short_name) }, []);
      return;
    }
    setPaper({ id: selected.id, name: selected.name, nameEn: selected.name_en, group: selected.group ?? null });
    pushSyllabusUrl(locale, slugify(exam.short_name), levelSlug(selected));
  };

  const handleLevelSelect = (selectedLevel: SelectedLevel, path: SyllabusLevel[]) => {
    if (!exam) return;
    setLevel(selectedLevel);
    setStep("dashboard");
    // `path` already includes the seeded paper node (LevelPickerStep's own
    // `path` state starts as [rootLevel]) when one was picked, so this
    // naturally produces .../{examSlug}/{paperSlug}/{levelSlug} without any
    // special-casing here.
    const levelSegments = selectedLevel.id === "full-exam" ? ["full-exam"] : path.map(levelSlug);
    pushSyllabusUrl(locale, slugify(exam.short_name), ...levelSegments);
    setPendingLevelPath(undefined);
    // The root of `path` is this entry's identity beyond just the exam —
    // whatever the user picked at the TOP of the tree, whether that came
    // from an explicit Paper step (CTET) or straight from LevelPickerStep's
    // own root tier (HTET's Level 1/2/3, no separate step at all). An exam
    // whose root has only one option never branches, so `path` stays empty
    // and this is null — matching today's single-entry-per-exam behavior.
    const rootNode = path.length > 0 ? path[0] : null;
    const rootSelection: TrackedPaper | null = rootNode
      ? { id: rootNode.id, name: rootNode.name, nameEn: rootNode.name_en, group: rootNode.group ?? null }
      : null;
    // Also mirrored into `paper` state (harmless at this point — the Paper
    // step, if any, is already behind us and about to unmount) so the
    // dashboard's "Try again" retry button, which reads `paper` directly,
    // stays correct for exams with no explicit Paper step too (HTET's
    // Level 1/2/3 never otherwise set this state at all).
    setPaper(rootSelection);
    loadFullTracker(exam, rootSelection, selectedLevel);
  };

  const handleLevelInvalidSlug = () => {
    setPendingLevelPath(undefined);
    if (exam) replaceSyllabusUrl(locale, slugify(exam.short_name));
  };

  // Every chapter in the fetched tree is tracked by default — there's no
  // customize/deselect step anymore — so this mostly just reshapes the
  // syllabus API's response into tracker state. It also bakes in cross-exam
  // completion: if a subject here has the same name as an already-100%
  // subject in another tracked exam/paper, it starts pre-completed with a
  // "Completed already in X" credit rather than as a fresh incomplete
  // section (see findCrossExamCompletion in syllabusTracker.ts).
  const loadFullTracker = (forExam: WizardExam, forPaper: TrackedPaper | null, forLevel: SelectedLevel) => {
    setLoadingTracker(true);
    setTrackerLoadError(false);
    fetchSyllabusTree(forExam.id, forLevel.id, locale)
      .then((tree) => {
        // Every subject the API returns is kept, even one with zero
        // chapters mapped yet (e.g. MAHATET's "Marathi") — otherwise this
        // subject list silently disagrees with the section tabs the real
        // preparation page shows for the same exam/level.
        const subjects: TrackedExamEntry["subjects"] = {};
        for (const [subject, chapters] of Object.entries(tree)) {
          subjects[subject] = chapters.map((c) => ({ id: c.id, name: c.name, completed: false, revisedAt: null }));
        }

        const existingExams = getAllTrackedExams();
        const crossCompletions: Record<string, string> = {};
        for (const subjectName of Object.keys(subjects)) {
          const creditFrom = findCrossExamCompletion(existingExams, forExam.id, forPaper?.id ?? null, subjectName);
          if (creditFrom) {
            subjects[subjectName] = subjects[subjectName].map((c) => ({ ...c, completed: true }));
            crossCompletions[subjectName] = creditFrom;
          }
        }

        const next: TrackedExamEntry = {
          exam: {
            id: forExam.id,
            shortName: forExam.short_name,
            name: forExam.name,
            logoUrl: forExam.logo_url,
            examType: forExam.exam_type,
          },
          paper: forPaper,
          level: { id: forLevel.id, name: forLevel.name, nameEn: forLevel.nameEn },
          subjects,
          ...(Object.keys(crossCompletions).length ? { crossCompletions } : {}),
          trackedAt: new Date().toISOString(),
        };

        upsertTrackedExam(next);
        setTrackedExams(getAllTrackedExams());
        setState(next);
      })
      .catch(() => setTrackerLoadError(true))
      .finally(() => setLoadingTracker(false));
  };

  const handleToggleChapter = (subject: string, chapterId: number) => {
    if (!state) return;
    const examId = state.exam.id;
    const paperId = state.paper?.id ?? null;

    let allExams = updateTrackedExamSubjects(examId, paperId, (subjects) => ({
      ...subjects,
      [subject]: subjects[subject].map((c) => (c.id === chapterId ? { ...c, completed: !c.completed } : c)),
    }));

    // If that toggle just made this subject fully complete, credit the same
    // subject wherever else it's tracked and not yet complete.
    const updatedChapters = allExams.find((e) => e.exam.id === examId && (e.paper?.id ?? null) === paperId)?.subjects[subject] ?? [];
    const justCompleted = updatedChapters.length > 0 && updatedChapters.every((c) => c.completed);
    if (justCompleted) {
      allExams = propagateSubjectCompletion(allExams, examId, paperId, subject);
      replaceAllTrackedExams(allExams);
    }

    setTrackedExams(allExams);
    setState(allExams.find((e) => e.exam.id === examId && (e.paper?.id ?? null) === paperId) ?? null);
  };

  const handleReset = () => {
    if (state) removeTrackedExam(state.exam.id, state.paper?.id ?? null);
    const remaining = getAllTrackedExams();
    setTrackedExams(remaining);
    setState(null);
    setExam(null);
    setPaper(null);
    setLevel(null);
    setResetOpen(false);
    setStep(remaining.length > 0 ? "list" : "exam");
    replaceSyllabusUrl(locale);
  };

  const handleOpenTrackedExam = (entry: TrackedExamEntry) => {
    setExam(null);
    setPaper(null);
    setLevel(null);
    setState(entry);
    setStep("dashboard");
    const segments = entry.paper ? [levelSlug(entry.paper), levelSlug(entry.level)] : [levelSlug(entry.level)];
    pushSyllabusUrl(locale, slugify(entry.exam.shortName), ...segments);
  };

  const handleAddMoreExam = () => {
    setPendingExamSlug(undefined);
    setPendingLevelPath(undefined);
    setAddPaperExcludeIds(undefined);
    setPaper(null);
    setStep("exam");
    replaceSyllabusUrl(locale);
  };

  // Re-enters the wizard for an exam the user already tracks at least one
  // root-tier selection of (a paper, a level, whatever that exam calls it),
  // going straight past the Exam step with the already-tracked options
  // hidden — either at an explicit Paper step (CTET) or directly inside
  // LevelPickerStep's own root tier (HTET's Level 1/2/3, no separate step).
  // Distinct from "Add More Exam", which is for a completely different exam
  // and always starts at the Exam step.
  const handleAddPaper = (examId: number) => {
    const examEntries = getTrackedExamsByExamId(examId);
    if (examEntries.length === 0) return;
    const { id, shortName, name, logoUrl, examType } = examEntries[0].exam;
    setPendingExamSlug(undefined);
    setPendingLevelPath(undefined);
    setPaper(null);
    setAddPaperExcludeIds(
      examEntries.map((e) => e.paper?.id).filter((paperId): paperId is number => paperId != null),
    );
    setExam({ id, short_name: shortName, name, logo_url: logoUrl ?? null, exam_type: examType ?? "" });
    setStep("level");
    pushSyllabusUrl(locale, slugify(shortName));
    loadExamLevels(id);
  };

  // "Track a different exam" from within a dashboard — returns to the
  // tracked-exams list when other exams exist to pick from, otherwise
  // starts the first-time wizard (matches restoreFromLocation's own rule).
  const handleTrackDifferentExam = () => {
    setExam(null);
    setPaper(null);
    setLevel(null);
    setState(null);
    setAddPaperExcludeIds(undefined);
    const current = getAllTrackedExams();
    setTrackedExams(current);
    setStep(current.length > 0 ? "list" : "exam");
    replaceSyllabusUrl(locale);
  };

  if (step === "loading") return null;

  const activeStepperKey = step === "exam" || step === "dashboard" ? step : step === "level" ? (hasPaperTier && !paper ? "paper" : "level") : "exam";

  return (
    <div id="syllabus-tracker-app" className="max-w-[1080px] mx-auto px-3 pt-6 sm:py-6">
      {(step === "exam" || step === "level") && <Stepper activeKey={activeStepperKey} hasPaper={hasPaperTier} locale={locale} />}

      {step === "list" && (
        <TrackedExamsList
          exams={trackedExams}
          onOpen={handleOpenTrackedExam}
          onAddMore={handleAddMoreExam}
          onAddPaper={handleAddPaper}
          locale={locale}
        />
      )}

      {step === "exam" && (
        <ExamPickerStep
          onSelect={handleExamSelect}
          autoSelectSlug={pendingExamSlug}
          onInvalidSlug={handleExamInvalidSlug}
          excludeExamIds={trackedExams.map((e) => e.exam.id)}
          locale={locale}
        />
      )}

      {step === "level" && exam && (
        examLevels === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={190} borderRadius={16} />
            ))}
          </div>
        ) : hasPaperTier && !paper ? (
          <PaperPickerStep
            exam={exam}
            levels={examLevels ?? []}
            onSelect={handlePaperSelect}
            onBack={() => {
              setStep("exam");
              replaceSyllabusUrl(locale);
            }}
            autoSelectSlug={pendingLevelPath?.[0]}
            onInvalidSlug={() => {
              setPendingLevelPath(undefined);
              replaceSyllabusUrl(locale, slugify(exam.short_name));
            }}
            excludePaperIds={addPaperExcludeIds}
            locale={locale}
          />
        ) : (
          <LevelPickerStep
            exam={exam}
            onSelect={handleLevelSelect}
            onBack={() => {
              if (paper) {
                setPaper(null);
                replaceSyllabusUrl(locale, slugify(exam.short_name));
              } else {
                setStep("exam");
                replaceSyllabusUrl(locale);
              }
            }}
            onPathChange={(path) => pushSyllabusUrl(locale, slugify(exam.short_name), ...path.map(levelSlug))}
            rootLevel={paper ?? undefined}
            preloadedLevels={examLevels ?? undefined}
            excludeRootIds={addPaperExcludeIds}
            autoSelectPath={paper ? pendingLevelPath?.slice(1) : pendingLevelPath}
            onInvalidSlug={handleLevelInvalidSlug}
            stepNumber={hasPaperTier ? 3 : 2}
            stepTotal={hasPaperTier ? 4 : 3}
            locale={locale}
          />
        )
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
                onClick={() => exam && level && loadFullTracker(exam, paper, level)}
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
