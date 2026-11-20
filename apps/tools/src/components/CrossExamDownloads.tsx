"use client";

import { useState } from "react";
import Text from "@clearcut/ui/text";
import type { getDict } from "@/lib/dictionary";
import type { CrossExam } from "@/lib/savedImages/logic";

type Copy = ReturnType<typeof getDict>["tool"]["savedImages"];

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

/**
 * CC-174: after a download, "Also applying for CTET / HPTET / REET? Download in one click."
 * Each button builds that exam's file from the saved original with that exam's own spec.
 */
export default function CrossExamDownloads({
  copy,
  exams,
  docLabel,
  onDownload,
}: {
  copy: Copy;
  exams: CrossExam[];
  docLabel: string;
  /** true = downloaded; a string = why it was not (e.g. the file would break the exam's KB range). */
  onDownload: (exam: CrossExam) => Promise<true | string>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<string | null>(null);
  if (exams.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border-gray-subtle)] p-3" data-testid="cross-exam-downloads">
      <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
        {fill(copy.crossTitle, { exams: exams.map((e) => e.shortName).join(" / ") })}
      </Text>
      <div className="flex flex-wrap gap-2">
        {exams.map((exam) => (
          <button
            key={exam.slug}
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              if (busy) return;
              setBusy(exam.slug);
              setFailed(null);
              const outcome = await onDownload(exam);
              setBusy(null);
              if (outcome === true) setDone((d) => ({ ...d, [exam.slug]: true }));
              else setFailed(outcome);
            }}
            className="rounded-full border border-brand/40 bg-brand/5 px-3 py-2 body-small !font-semibold text-brand disabled:opacity-60"
          >
            {busy === exam.slug ? copy.working : done[exam.slug] ? fill(copy.crossDone, { exam: exam.shortName }) : fill(copy.crossButton, { exam: exam.shortName, doc: docLabel })}
          </button>
        ))}
      </div>
      {failed && (
        <p role="alert" className="body-small text-red-600">
          {failed}
        </p>
      )}
    </div>
  );
}
