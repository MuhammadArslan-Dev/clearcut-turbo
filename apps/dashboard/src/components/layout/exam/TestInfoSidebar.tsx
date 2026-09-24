"use client";

import { memo } from "react";
import { FileText } from "lucide-react";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import InfoRow from "@/components/features/daily-tests/InfoRow";
import { useExamSummary } from "@/components/features/exam/hooks/useExamSummary";
import { ClockIcon, ChartSuccessBarIcon } from "@/components/ui/icons";

// Left "Test Information" panel — mirrors the Daily Test attempt page's card
// (same Card/InfoRow shape) so the full-length exam screen reads as the same
// pattern instead of a different layout. Desktop only, matching the Daily
// Test attempt page's own left sidebar.
function TestInfoSidebar() {
  const info = useExamSummary();

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col gap-4 p-3 pr-0 lg:flex lg:pl-4">
      <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12} className="!h-auto">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={18} className="text-brand" />
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
            Test Information
          </Text>
        </div>
        <div className="flex flex-col gap-3">
          <InfoRow
            compact
            icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />}
            label="Exam"
            value={info.examShortName}
          />
          <InfoRow
            compact
            icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />}
            label="Section"
            value={info.sectionName}
          />
          <InfoRow
            compact
            icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />}
            label="Total Questions"
            value={info.totalQuestions != null ? String(info.totalQuestions) : "—"}
          />
          <InfoRow
            compact
            icon={<ChartSuccessBarIcon width={16} height={16} />}
            label="Total Marks"
            value={info.totalMarks != null ? String(info.totalMarks) : "—"}
          />
          <InfoRow
            compact
            icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />}
            label="Time Duration"
            value={info.durationLabel}
          />
        </div>
      </Card>
    </aside>
  );
}

export default memo(TestInfoSidebar);
