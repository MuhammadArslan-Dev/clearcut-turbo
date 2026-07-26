// src/components/layout/Sidebar.tsx
"use client";

import React, { useCallback } from "react";
import ProgressCard from "@/components/features/test-series/components/cards/ProgressCard";
import Text from "@clearcut/ui/text";
import TopicListCard from "@/components/ui/cards/preparation/topic-card/topic-list-card";
import {
  ChevronIcon,
  PenIcon,
  SheildIcon,
} from "@/components/ui/icons";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import BookmarkIcon from "@/components/ui/icons/bookmark-icon";
import { Button } from "@clearcut/ui/button";
import TickIcon from "@/components/ui/icons/tick-icon";
import {
  ProgressData,
  RecommendedTestData,
  useTestListDataStore,
} from "@/components/features/test-series/store/useTestListDataStore";
import { useTestSeriesModalStore } from "@/components/features/test-series/store/useTestSeriesModalStore";
import { useTranslations } from "next-intl";
import DiscountBadgeIcon from "@/components/ui/icons/discount-badge-icon";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Sidebar() {
  const { recommendedTests, progressData, isLoading } =
    useTestListDataStore();

  // Show skeleton while loading
  if (!recommendedTests) return <SidebarSkeleton />;

  return (
    <aside className="hidden md:flex max-h-[calc(100%-5px)] w-[380px] flex-col p-2 pl-8">
      <div className="max-h-full overflow-y-auto rounded-md bg-white px-3 py-4 shadow-sm">
        {progressData && (
          <>
            <ProgressSection progressData={progressData} />
            <Divider />
          </>
        )}

        {recommendedTests?.test && (
          <>
            <RecommendedNextSection data={recommendedTests} />
            <Divider />
          </>
        )}

        <ClearCutoffSection />
      </div>
    </aside>
  );
}

/* =========================================================
   PROGRESS SECTION
========================================================= */

function ProgressSection({
  progressData,
}: {
  progressData: ProgressData;
}) {
  const sidebarT = useTranslations("testListContent");

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{sidebarT("progress.title")}</SectionTitle>

      <ProgressCard
        title={progressData.title}
        total={progressData.total}
        completed={progressData.completed}
        message={sidebarT("progress.attemptMessage")}
      />
    </div>
  );
}

/* =========================================================
   RECOMMENDED NEXT TEST
========================================================= */

function RecommendedNextSection({
  data,
}: {
  data: RecommendedTestData;
}) {
  const { open } = useTestSeriesModalStore();
  const sidebarT = useTranslations("testListContent");

  const startTest = useCallback(() => {
    if (!data?.test) return;

    open("pre-test-confirmation", {
      test: data.test,
      sectionId: data.sectionId,
    });
  }, [open, data]);

  return (
    <div className="flex flex-col gap-3">
      <Text
        as="div"
        variant="heading-small"
        weight="semibold"
        color="gray-normal"
      >
        {sidebarT("recommendedNext.title")}{" "}
        <Text
          as="span"
          variant="body-medium"
          weight="normal"
          color="gray-subtle"
        >
          {sidebarT("recommendedNext.subtitle")}
        </Text>
      </Text>

      <div className="flex w-full flex-col items-center justify-center gap-3">
        <TopicListCard
          cardBgColor="!px-0"
          titleClassName="!body-medium !font-normal !text-surface-gray-subtle"
          metaTextClassName="body-small !font-normal text-surface-gray-muted"
          containerClassName="px-3 py-2 w-full"
          isActive
          counter={{
            value: data.test?.order,
            colorKey: "info",
            variant: "simple",
          }}
          features={[
            {
              icon: <PenIcon variant="pen-scale" size={16} />,
              value: sidebarT("testCard.questionsInfo", {
                count: data.totalQuestions ?? 0,
                marks: 1,
              }),
            },
            {
              icon: <SandTimerIcon size={16} />,
              value: sidebarT("testCard.duration", {
                time: data.totalQuestions ?? 0,
              }),
            },
          ]}
          title={data.title}
          onClick={startTest}
          bgColor="bg-[#f1f5fa]"
        />

        <div className="w-[70%]">
          <Button
            onClick={startTest}
            fullWidth
            variant="outlined"
            sx={{ borderRadius: "50px" }}
          >
            <div className="flex gap-1 items-center">
              <p>Start Test</p>
              <ChevronIcon
                size={20}
                type="double"
                variant="right"
                color="#0083ff"
              />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO SECTION
========================================================= */

function ClearCutoffSection() {
  const sidebarT = useTranslations("testListContent");

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{sidebarT("testSeries.title")}</SectionTitle>

      <div className="px-3 flex flex-col gap-2">
        <InfoRow
          icon={
            <DiscountBadgeIcon
              color="var(--icon-gray-muted)"
              size={20}
            />
          }
          text={sidebarT("testSeries.preparedUsing")}
        />

        <InfoRow
          icon={
            <SheildIcon
              color="var(--icon-gray-muted)"
              size={20}
              mode="simple"
              variant="outline"
            />
          }
          text={sidebarT("testSeries.basedOnPattern", {
            course: "CTET",
          })}
        />

        <InfoRow
          icon={
            <TickIcon
              size={20}
              color="var(--icon-gray-muted)"
              variant="double"
            />
          }
          text={sidebarT("testSeries.noNegativeMarking")}
        />
      </div>
    </div>
  );
}

/* =========================================================
   SKELETON UI (PRODUCTION)
========================================================= */

function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex max-h-[calc(100%-5px)] w-[380px] flex-col p-2 pl-8">
      <div className="max-h-full overflow-y-auto rounded-md bg-white px-3 py-4 shadow-sm animate-pulse space-y-6">
        
        {/* Progress */}
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-16 w-full rounded-md" />
        </div>

        <Divider />

        {/* Recommended */}
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-48" />
          <SkeletonLine className="h-16 w-full rounded-md" />
          <SkeletonLine className="h-10 w-[70%] mx-auto rounded-full" />
        </div>

        <Divider />

        {/* Info list */}
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-40" />

          <div className="space-y-2 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonLine className="h-5 w-5 rounded-full" />
                <SkeletonLine className="h-4 w-56" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`bg-gray-200 ${className}`} />;
}

/* =========================================================
   REUSABLE HELPERS
========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text
      as="p"
      variant="heading-small"
      weight="semibold"
      color="gray-normal"
    >
      {children}
    </Text>
  );
}

function Divider() {
  return <div className="my-4 h-0.5 bg-gray-300" />;
}

function InfoRow({
  text,
  icon,
}: {
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-5">{icon ?? <BookmarkIcon />}</div>

      <Text
        as="p"
        variant="body-large"
        weight="normal"
        color="gray-muted"
      >
        {text}
      </Text>
    </div>
  );
}