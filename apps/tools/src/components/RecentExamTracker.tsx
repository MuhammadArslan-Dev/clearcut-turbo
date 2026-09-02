"use client";

import { useEffect } from "react";
import { pushRecentExam } from "@/lib/recentExams";
import { ResizerExamSpec } from "@/lib/resizerExams";

/** Invisible — mounted once on each exam page to record the visit for the hub's "Recently viewed" row. */
export default function RecentExamTracker({ exam }: { exam: Pick<ResizerExamSpec, "slug" | "shortName" | "photoSpec"> }) {
  useEffect(() => {
    pushRecentExam(exam);
    // Only the slug should re-trigger this — shortName/photoSpec are static
    // for a given slug, and exam is a fresh object identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.slug]);

  return null;
}
