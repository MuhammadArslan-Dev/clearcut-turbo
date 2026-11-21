"use client";

// Phase 122: mounted once on the Learn page. Decides eligibility (no enrolment has a level yet), reads the GrowthBook
// flag ONLY for an eligible learner (so a configured learner never gets an `$exposure`), and in the variant opens the
// Select Paper sheet by itself once per enrolment. Renders nothing.
import { useEffect, useRef } from "react";
import type { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { useExperimentValue } from "@/lib/experiments";
import { useAuth } from "@/providers/AuthProvider";
import { useCourseStore } from "@/store/course/useCourseStore";
import { SETUP_FIRST_CONTROL, SETUP_FIRST_FLAG, isSetupFirst, needsFirstSetup } from "./setupFirstValue";
import { openSetupSheet, readStoredDraft, useSetupFirstStore } from "./useSetupFirstStore";

const AUTO_OPEN_KEY = "cc-setup-first-auto:";

export function wasAutoOpened(enrolmentUuid: string): boolean {
  try {
    return window.localStorage.getItem(AUTO_OPEN_KEY + enrolmentUuid) === "1";
  } catch {
    return false;
  }
}

function markAutoOpened(enrolmentUuid: string): void {
  try {
    window.localStorage.setItem(AUTO_OPEN_KEY + enrolmentUuid, "1");
  } catch {
    /* private mode: it may open again next visit, which is harmless */
  }
}

/** Reads the flag. Mounted only while eligible, so `useExperimentValue` starts not-ready (no control-then-variant swap). */
/**
 * Local QA only (`next dev`; a production build compiles this to null): localStorage `cc-setup-first-variant` =
 * `setup_first` | `control` forces the variant, because GrowthBook is off on localhost.
 */
function devForcedVariant(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
    return window.localStorage.getItem("cc-setup-first-variant");
  } catch {
    return null;
  }
}

function SetupFirstEvaluator({ course }: { course: ExamEnrollmentWithExam }) {
  const exp = useExperimentValue<string>(SETUP_FIRST_FLAG, SETUP_FIRST_CONTROL);
  const forced = exp.ready ? devForcedVariant() : null;
  const value = forced ?? exp.value;
  const ready = exp.ready;
  const setAnswer = useSetupFirstStore((s) => s.setAnswer);
  const autoTried = useRef(false);

  useEffect(() => {
    if (ready) setAnswer(value);
  }, [ready, value, setAnswer]);

  // Variant: bring back a paper picked on an earlier visit (the card, banner and sheet then continue from it).
  useEffect(() => {
    if (!ready || !isSetupFirst(value) || course.exam?.id == null) return;
    const examId = course.exam.id;
    if (useSetupFirstStore.getState().drafts[String(examId)]) return;
    const stored = readStoredDraft(examId);
    if (stored) useSetupFirstStore.setState((s) => ({ drafts: { ...s.drafts, [String(examId)]: stored } }));
  }, [ready, value, course.exam?.id]);

  // Variant only: open the sheet by itself, once per enrolment (per browser), never on top of another open sheet.
  useEffect(() => {
    if (!ready || !isSetupFirst(value) || autoTried.current) return;
    autoTried.current = true;
    if (!course.uuid || !course.exam || wasAutoOpened(course.uuid)) return;
    if (useCourseStore.getState().isOpen) return;
    markAutoOpened(course.uuid);
    openSetupSheet(course.exam, "auto_open");
  }, [ready, value, course]);

  return null;
}

export default function SetupFirstGate({
  courses,
  activeCourse,
}: {
  courses: readonly (ExamEnrollmentWithExam | null)[];
  activeCourse: ExamEnrollmentWithExam | null;
}) {
  const { user } = useAuth();
  const setEligibility = useSetupFirstStore((s) => s.setEligibility);
  const reset = useSetupFirstStore((s) => s.reset);
  // No user id yet = cannot be bucketed: stay out (control), never "pending" forever.
  const eligible = !!user?.uuid && !!activeCourse && needsFirstSetup(courses.length ? courses : [activeCourse]);

  useEffect(() => {
    setEligibility(eligible, activeCourse?.created_at ?? null);
  }, [eligible, activeCourse?.created_at, setEligibility]);

  // Leaving the Learn page: nothing of this page view carries over.
  useEffect(() => () => reset(), [reset]);

  if (!eligible || !activeCourse || !user?.uuid) return null;
  // (eligible implies both; the checks narrow the types)
  // Keyed by the learner: another login on the same browser must not keep the previous learner's variant.
  return <SetupFirstEvaluator key={user.uuid} course={activeCourse} />;
}
