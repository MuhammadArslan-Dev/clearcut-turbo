"use client";

/**
 * Dev/QA only. The screens each animation hands over to, built from the app's own pieces with sample data:
 * the Learn dashboard (onboarding → `/dashboard?user_type=new`) and the Preparation page
 * (enrollment → `/preparation/{group_code}?subject_selected=1`).
 */
import { useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import MyCourseCard from "@/components/features/dashboard/mycourse/MyCourseCard";

export function MockDashboard({ examName, subjectsPicked = false }: { examName: string; subjectsPicked?: boolean }) {
  const t = useTranslations("DashboardHome");
  return (
    <div className="min-h-dvh w-full bg-gray-100">
      <div className="flex items-center gap-3 bg-[var(--color-brand-dark)] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 heading-medium !font-semibold">S</span>
        <span className="heading-medium !font-semibold">{t("greetingMorning", { name: t("defaultName") })} 👋</span>
      </div>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 p-4 md:flex-row md:items-start">
        <MyCourseCard
          cardClasses="!rounded-2xl"
          price="{}"
          badge="trial"
          trialStartedAt={Date.now()}
          examShortName="HTET"
          courseName={examName}
          logo={null}
          topics={{ completed: 0, total: 0 }}
          tests={{ completed: 0, total: 0 }}
          needsSubjects={!subjectsPicked}
          continueClick={() => {}}
          unlockClick={() => {}}
          editClick={() => {}}
        />
        <div className="flex w-full flex-1 flex-col gap-3">
          {[0, 1].map((i) => (
            <Card key={i} padding={16} borderRadius={12} bgcolor="white" bordercolor="var(--surface-border-gray-subtle)">
              <div className="flex w-full flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MockPreparation({ examName, paper, picks }: { examName: string; paper: string; picks: string[] }) {
  return (
    <div className="min-h-dvh w-full bg-gray-100">
      <div className="flex flex-col bg-white px-4 py-3">
        <Text variant="heading-large" weight="semibold" className="block">{examName}</Text>
        <Text variant="body-small" color="gray-muted" className="block">{paper}</Text>
      </div>
      <div className="flex gap-2 overflow-x-auto bg-white px-4 pb-3">
        {picks.map((p, i) => (
          <span
            key={p}
            className={`shrink-0 rounded-full px-4 py-1.5 body-medium !font-semibold ${i === 0 ? "bg-[var(--color-primary-soft)] text-brand" : "bg-gray-100 text-surface-gray-muted"}`}
          >
            {p}
          </span>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-3 p-4">
        {picks.map((p) => (
          <Card key={p} padding={16} borderRadius={12} bgcolor="white" bordercolor="var(--surface-border-gray-subtle)">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Text variant="heading-small" weight="semibold">{p}</Text>
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
