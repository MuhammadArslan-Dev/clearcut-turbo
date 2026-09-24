"use client";

import { useMemo } from "react";
import { useExamStore } from "../store/useExamStore";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";

const TEST_TYPE_LABEL: Record<string, string> = {
  "full-length": "Full Length Test",
  sectional: "Sectional Test",
  chapter: "Chapter Test",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (h) parts.push(`${h} ${h === 1 ? "Hour" : "Hours"}`);
  if (m || !h) parts.push(`${m} ${m === 1 ? "Minute" : "Minutes"}`);
  return parts.join(" ");
};

/**
 * Single source of the exam's display summary (title/meta for the topbar,
 * plus the individual fields the Test Information sidebar shows) — both
 * previously derived this from the store independently, which risked them
 * drifting (e.g. a different "Marks fall back to question count" rule).
 */
export function useExamSummary() {
  const exam = useExamStore((s) => s.exam);
  const currentSection = useExamStore((s) => s.currentSection);
  const shortName = useGetCurrentCourseStore((s) => s.exam?.short_name);

  return useMemo(() => {
    if (!exam) {
      return {
        examShortName: shortName ?? "—",
        sectionName: "—",
        totalQuestions: null as number | null,
        totalMarks: null as number | null,
        durationLabel: "—",
        title: shortName ?? "",
        meta: "",
      };
    }

    let questions = 0;
    let marks = 0;
    exam.sections.forEach((s) => {
      questions += s.questions.length;
      marks += Number(s.section?.total_marks ?? 0);
    });
    // Marks fall back to the question count (+1 each) when a section has no total.
    const totalMarks = marks || questions;

    const type = TEST_TYPE_LABEL[exam.type ?? ""] ?? "Test";
    const date = exam.started_at ? ` (${dateFmt.format(new Date(exam.started_at.replace(" ", "T")))})` : "";
    const duration = Number(exam.total_duration_seconds ?? 0);
    const sectionName = exam.sections[currentSection]?.section?.name ?? "—";

    return {
      examShortName: shortName ?? "—",
      sectionName,
      totalQuestions: questions,
      totalMarks,
      durationLabel: duration ? formatDuration(duration) : "—",
      title: `${type}${shortName ? ` – ${shortName}` : ""}${date}`,
      meta: [`${questions} Questions`, `${totalMarks} Marks`, duration ? formatDuration(duration) : null]
        .filter(Boolean)
        .join(" • "),
    };
  }, [exam, currentSection, shortName]);
}
