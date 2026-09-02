"use client";

import { useEffect, useState } from "react";
import Text from "@clearcut/ui/text";
import ExamCard from "./ExamCard";
import { getRecentExams, RecentExamEntry } from "@/lib/recentExams";

/**
 * Reads localStorage on mount (so it renders nothing during SSR/first paint
 * — there's no server-known value to hydrate, unlike createPersistedStore's
 * pattern elsewhere in this monorepo, since this is plain localStorage, not
 * a Zustand store) and shows a quick-access row for a returning visitor.
 * Nothing renders if the visitor has no history yet.
 */
export default function RecentExams() {
  const [entries, setEntries] = useState<RecentExamEntry[]>([]);

  useEffect(() => {
    setEntries(getRecentExams());
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="max-w-[1080px] mx-auto px-2 mb-10">
      <Text as="h2" variant="body-large" weight="semibold" color="gray-normal" className="mb-3">
        Recently viewed
      </Text>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map((exam) => (
          <ExamCard key={exam.slug} exam={exam} />
        ))}
      </div>
    </div>
  );
}
