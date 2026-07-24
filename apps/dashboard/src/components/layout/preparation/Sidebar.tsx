"use client";

import React, { useEffect, useMemo, useRef, useCallback } from "react";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { motion } from "framer-motion";

import TopicListCard from "@/components/ui/cards/preparation/topic-card/topic-list-card";
import TopicListCardSkeleton from "@/components/ui/cards/preparation/topic-card/topic-list-card-skeleton";
import SectionHeaderCard from "@/components/ui/cards/preparation/chapter-list/SectionHeaderCard";
import { Card } from "@clearcut/ui/card";
import ProgressBar from "@/components/ui/ProgressBar";

import SectionsTab from "@/components/features/preparation/components/SectionsTab";
import PaperSwitch from "@/components/features/preparation/components/PaperSwitch";
import AreaTab from "@/components/features/preparation/components/AreaTab";

import {
  ChevronIcon,
  CircleTickIcon,
  FireIcon,
  ListIcon,
  LockIcon,
  PenIcon,
  StarBadge,
  VideoCamIcon,
} from "@/components/ui/icons";

import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSearchParams } from "next/navigation";

import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";
import { useChapterData } from "@/components/features/preparation/hooks/useChapterData";

import { Chapter, Topic } from "@/components/features/preparation/types/types";

import {
  getChapterProgress,
  getOverallChapterProgress,
  isTopicCompleted,
} from "@/components/features/preparation/util/progressTracker";

import { Skeleton } from "@/components/ui/skeleton";
import Text from "@clearcut/ui/text";
import { setResumeState } from "@/lib/dashboard/userInteractions";
import { Divider } from "@mui/joy";
import CDivider from "@/components/ui/CDivider";
import { trackEvent } from "@/lib/analytics/browser";
import PieChartIcon from "@/components/ui/icons/pie-chart-icon";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { limitChars } from "@clearcut/utils/text-limit";
import { toLower } from "@clearcut/utils/text-format";
import clsx from "clsx";
import CounterCard from "@/components/ui/cards/CounterCard";
import Button from "@/components/ui/button/Button";
import {
  PaywallSource,
  usePaywallsStore,
} from "@/components/features/PayWalls/usePaywallsStore";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import PaywallFloatingWidget, {
  handleOpenPaywall,
} from "@/components/features/PayWalls/PaywallFloatingWidget";
import AppDownloadWidget from "@/components/features/PayWalls/AppDownloadWidget";
import { useRouter } from "@/i18n/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { set } = useQueryParams();
  const isMobile = useIsMobile();
  const [expandedTopics, setExpandedTopics] = React.useState<
    Record<number, boolean>
  >({});
  const router = useRouter();
  const { open } = usePreparationModalStore();
  const { open: openPaywall } = usePaywallsStore();
  const { course: courseData } = useGetCurrentCourseStore();

  const topicContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTopicRef = useRef<HTMLDivElement | null>(null);

  const {
    selectedSectionId,
    chapters,
    course,
    setChapters,
    setChapter,
    setTopic,
    selectedTopic,
    selectedPaperId,
    progressByTopicId,
    selectedChapter,
    sectionsByPaperId,
    selectedArea,
  } = usePreparationStore();

  // Fetch chapters for selected section
  const { syllabus } = useChapterData(selectedSectionId);
  const searchParams = useSearchParams();
  const urlParamsApplied = useRef(false);

  // Sync fetched syllabus into store; on first load apply URL chapter/topic params
  useEffect(() => {
    if (!syllabus?.chapters?.length) return;
    let state = syllabus.state;
    if (!urlParamsApplied.current) {
      const urlChapter = searchParams.get("chapter");
      const urlTopic = searchParams.get("topic");
      if (urlChapter || urlTopic) {
        state = {
          ...syllabus.state,
          ...(urlChapter && { chapter_id: Number(urlChapter) }),
          ...(urlTopic && { topic_id: Number(urlTopic) }),
        };
      }
      urlParamsApplied.current = true;
    }
    setChapters(syllabus.chapters, state);
  }, [syllabus]);

  // Reset scroll on section change
  useEffect(() => {
    if (topicContainerRef.current) {
      topicContainerRef.current.scrollTop = 0;
    }
  }, [selectedPaperId]);

  // Auto-scroll active topic into view
  useEffect(() => {
    if (!topicContainerRef.current || !activeTopicRef.current) return;

    const container = topicContainerRef.current;
    const active = activeTopicRef.current;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const currentScroll = container.scrollTop;

    const offset =
      activeRect.top -
      containerRect.top -
      containerRect.height / 2 +
      activeRect.height / 2;

    container.scrollTo({
      top: currentScroll + offset,
      behavior: "smooth",
    });
  }, [selectedTopic]);

  // Filter chapters by selected area (if section has areas)
  const filteredChapters = useMemo(() => {
    if (!chapters) return undefined;
    if (!selectedArea) return chapters;
    return chapters.filter((c) => c.area === selectedArea.name);
  }, [chapters, selectedArea]);

  // Auto-select first chapter of filtered list when area changes
  useEffect(() => {
    if (!filteredChapters?.length) return;
    if (selectedChapter && filteredChapters.some((c) => c.id === selectedChapter.id)) return;
    setChapter(filteredChapters[0]);
  }, [filteredChapters]);

  // Build chapters lookup map (scoped to visible filtered chapters)
  const chaptersById = useMemo(() => {
    const map: Record<number, Chapter> = {};
    (filteredChapters ?? []).forEach((chapter) => {
      map[chapter.id] = chapter;
    });
    return map;
  }, [filteredChapters]);

  // Overall progress
  const { completedChapters, totalChapters } = useMemo(() => {
    return getOverallChapterProgress(chaptersById, progressByTopicId);
  }, [chaptersById, progressByTopicId]);

  // Handlers (stabilized)
  const handleTopicChange = useCallback(
    (chapter: Chapter, topic: Topic) => {
      setChapter(chapter);
      setTopic(topic);

      if (isMobile) {
        set({ topic: true }, { replace: false });
      }
    },
    [isMobile, set, setChapter, setTopic],
  );

  useEffect(() => {
    const setResume = async () => {
      await setResumeState({
        course_id: String(course?.group_code),
        paper_id: selectedPaperId != null ? String(selectedPaperId) : null,
        section_id:
          selectedSectionId != null ? String(selectedSectionId) : null,
        chapter_id:
          selectedChapter?.id != null ? String(selectedChapter.id) : null,
        topic_id: selectedTopic?.id ?? null,
      });
    };

    setResume();

    if (!selectedTopic || !chapters) return;

    // find parent topic that owns this child
    for (const chapter of chapters) {
      for (const topic of chapter.topics) {
        if (topic.children?.some((c) => c.id === selectedTopic.id)) {
          setExpandedTopics({ [topic.id]: true });
          return;
        }
      }
    }
  }, [selectedTopic, chapters]);

  const toggleTopic = (topicId: number) => {
    setExpandedTopics((prev) => {
      const isCurrentlyOpen = prev[topicId];

      // Close all, then open only this one (or close if already open)
      return isCurrentlyOpen
        ? {} // close all if clicking same open one
        : { [topicId]: true }; // open only this one
    });
  };

  const sections = selectedPaperId
    ? (sectionsByPaperId[selectedPaperId] ?? [])
    : [];
  const fromSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <aside className=" relative flex h-full w-full md:w-[var(--preparation-sidebar-width)] flex-col overflow-hidden md:p-2">
      <div className="h-full bg-[var(--background-gray-subtle)] md:bg-white shadow-sm space-y-4 overflow-hidden  md:rounded-md">
        {/* Progress summary */}
        <div
          className="absolute space-y-2 z-50 w-full bottom-0 left-1/2 -translate-x-1/2"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex justify-center w-full">
            <button
              type="button"
              onClick={() => open("chapter-index")}
              className="w-[115px] px-3 py-2 md:py-2 md:px-4 flex gap-2 items-center justify-center rounded-sm cursor-pointer bg-[#243547] text-white "
            >
              <ListIcon size={20} variant="lines" />

              <Text
                className="text-white"
                variant="heading-small"
                weight="semibold"
              >
                {t("common.index")}
              </Text>
            </button>
          </div>
          <PaywallFloatingWidget />
        </div>

        {/* Topics list */}
        <nav
          ref={topicContainerRef}
          className="h-[calc(100%-10px)] md:h-[calc(100%-10px)] flex-1 py-4 pb-44 overflow-y-auto "
        >
          <div className="px-3 lg:px-0 flex justify-center w-full">
            <Card borderRadius="8px" width={"315px"} padding={0}>
              <div className="bg-white px-4 py-3 space-y-2 rounded-md">
                <div className="flex justify-center gap-4">
                  {/* Marks */}
                  <ProgressBlock
                    title={`30/150 ${t("common.marks")}`}
                    icon={
                      <PieChartIcon size={24} color="var(--icon-gray-muted)" />
                    }
                  />

                  {/* Chapters */}
                  <ProgressBlock
                    title={`${completedChapters}/${totalChapters} ${t("common.chapters")}`}
                    icon={
                      <FireIcon
                        variant="outline"
                        color="var(--icon-gray-muted)"
                      />
                    }
                  />
                </div>

                <ProgressBar
                  showLabel={false}
                  completed={Number(completedChapters)}
                  total={Number(totalChapters)}
                />
              </div>
            </Card>
          </div>
         <div>
           <AreaTab />
         </div>

          {!chapters && <TopicListSkeleton />}

          {filteredChapters?.map((chapter, chapterIndex) => {
            const chapterProgress = getChapterProgress(
              chapter.id,
              chaptersById,
              progressByTopicId,
            );

            return (
              <React.Fragment key={chapter.id}>
                <div className="h-0.5 my-4 bg-[var(--border-gray-muted)] w-full"></div>
                <div className={clsx("flex flex-col gap-3")}>
                  <div className="sticky -top-4 z-0 bg-white">
                    <SectionHeaderCard
                      onClick={() =>
                        chapter?.locked
                          ? handleOpenPaywall(
                            router,
                            "topic_card_clicked",
                            course,
                          )
                          : {}
                      }
                      trailingIcon={
                        chapter?.locked && (
                          <CounterCard
                            width="w-[100px]"
                            height="h-8"
                            borderColor="border-[#0083ff] border-2"
                            value={
                              <div className="flex items-center gap-2">
                                {" "}
                                <Text
                                  as="p"
                                  variant="body-medium"
                                  weight="normal"
                                  color="primary-normal"
                                >
                                  Unlock
                                </Text>
                                <LockIcon size={20} color="#0083ff" />
                              </div>
                            }
                          />
                        )
                      }
                      breadcrumb={
                        <div className="flex items-center gap-1">
                          <Text
                            // as="p"
                            variant="body-medium"
                            weight="normal"
                            className="!font-normal text-surface-gray-muted"
                          >
                            {t("common.chapter")} {chapterIndex + 1}
                          </Text>
                          <Text
                            // as="p"
                            variant="body-small"
                            weight="normal"
                            className="!font-normal text-surface-gray-muted"
                          >
                            • {chapterProgress.completedTopics} /
                            {chapterProgress.totalTopics}{" "}
                            {toLower(t("course.courseStatus.completed"))}
                          </Text>
                        </div>
                      }
                      title={chapter.name}
                      cursor="cursor-pointer"
                      titleClassName="heading-medium !font-semibold text-surface-gray-normal"
                      breadcrumbClassName="body-medium !font-normal text-surface-gray-muted"
                      radiusClassName="rounded-none"
                      bgClassName={
                        selectedChapter?.id === chapter.id
                          ? "bg-brand/12"
                          : "bg-white lg:!bg-[var(--background-gray-subtle)]"
                      }
                      containerClassName="px-4 py-3 "
                    />
                  </div>

                  <div className="px-3 space-y-2">
                    {chapter.topics.map((topic, topicIndex) => {
                      const isActive = selectedTopic?.id === topic.id;
                      const topicProgress = progressByTopicId[topic.id];
                      const completed = isTopicCompleted(topicProgress);

                      const hasChildren = topic.children.length > 0;
                      const isExpanded = expandedTopics[topic.id];

                      return (
                        <div key={topic.id} className="space-y-2">
                          {/* 🔹 Parent Topic Card */}
                          <div ref={isActive ? activeTopicRef : null}>
                            <TopicListCard
                              cardBgColor="!px-0"
                              badge={
                                <div className="flex gap-2">
                                  <Text as="p" className="whitespace-nowrap">
                                    {hasChildren
                                      ? `(${topic.children.length} sub-topics)`
                                      : topic.difficulty_level}
                                  </Text>
                                  {hasChildren ? (
                                    <ChevronIcon
                                      variant={isExpanded ? "up" : "down"}
                                      color="#192839"
                                      size={20}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <StarBadge size={20} />
                                      <Text
                                        as="p"
                                        variant="body-small"
                                        weight="bold"
                                        className="whitespace-nowrap !text-[#00a251]"
                                      >
                                        Easy
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              }
                              isActive={isActive}
                              titleClassName="body-large !font-normal !text-surface-gray-subtle"
                              metaTextClassName="body-small !font-normal text-surface-gray-muted"
                              containerClassName="px-3 py-2 md:border"
                              counter={{
                                custom: chapter?.locked ? true : false,
                                value: chapter?.locked ? (
                                  <CounterCard
                                    width="w-8"
                                    height="h-8"
                                    borderColor="border-[#0083ff] border-2"
                                    value={
                                      <LockIcon size={20} color="#0083ff" />
                                    }
                                  />
                                ) : (
                                  topicIndex + 1
                                ),
                                colorKey: completed ? "success" : "info",

                                variant: completed
                                  ? "filled"
                                  : topicProgress?.videoWatched ||
                                    topicProgress?.notesTaken ||
                                    topicProgress?.miniTestDone
                                    ? "progress"
                                    : "simple",
                              }}
                              features={
                                hasChildren
                                  ? []
                                  : [
                                    ...(topic.data?.some(d => d.type === "video") ? [{
                                      icon: topicProgress?.videoWatched ? (
                                        <CircleTickIcon
                                          size={16}
                                          variant="filled"
                                          value="true"
                                        />
                                      ) : (
                                        <VideoCamIcon
                                          variant="outline"
                                          size={16}
                                        />
                                      ),
                                      value: t("common.video"),
                                    }] : []),
                                    {
                                      icon: topicProgress?.notesTaken ? (
                                        <CircleTickIcon
                                          size={16}
                                          variant="filled"
                                          value="true"
                                        />
                                      ) : (
                                        <PenIcon
                                          variant="book-pen"
                                          size={16}
                                        />
                                      ),
                                      value: t("common.notes"),
                                    },
                                    ...(topic.has_mini_test !== false ? [{
                                      icon: topicProgress?.miniTestDone ? (
                                        <CircleTickIcon
                                          size={16}
                                          variant="filled"
                                          value="true"
                                        />
                                      ) : (
                                        <PenIcon size={16} />
                                      ),
                                      value: t("common.minitest"),
                                    }] : []),
                                  ]
                              }
                              title={
                                hasChildren
                                  ? limitChars(topic.name, 35)
                                  : limitChars(topic.name, 45)
                              }
                              onClick={() => {
                                if (chapter?.locked) {
                                  chapter?.locked &&
                                    handleOpenPaywall(router, "chapter_card_clicked", course);
                                  return;
                                } else {
                                  if (hasChildren) {
                                    toggleTopic(topic.id); // 🔥 toggle open / close
                                  } else {
                                    trackEvent("Topic Viewed", {
                                      entry_point: "scroll",
                                      section_name: fromSection?.name! ?? null,
                                      chapter_name: chapter.name,
                                      topic_name: topic.name,
                                      parent_topic_name: undefined,
                                    });
                                    handleTopicChange(chapter, topic);
                                  }
                                }
                              }}
                              bgColor={
                                isExpanded || isActive
                                  ? "bg-[var(--color-brand)]/12 md:border-[var(--color-brand)]"
                                  : completed
                                    ? "bg-[var(--color-success)]/12 lg:bg-white md:border-[var(--border-gray-muted)]"
                                    : "bg-white md:border-[var(--border-gray-muted)]" // "bg-white md:border-[var(--border-gray-muted)]"
                              }
                            />
                          </div>

                          {/* 🔽 Children (only when expanded) */}
                          {hasChildren && isExpanded && (
                            <div className="pl-6 flex gap-4">
                              <div
                                ref={activeTopicRef}
                                className=" w-0.5 bg-brand"
                              />
                              <div className=" flex-1 space-y-2">
                                {topic.children.map((child, childIndex) => {
                                  const isChildActive =
                                    selectedTopic?.id === child.id;
                                  const childProgress =
                                    progressByTopicId[child.id];
                                  const childCompleted =
                                    isTopicCompleted(childProgress);

                                  return (
                                    <div
                                      key={child.id}
                                      ref={
                                        isChildActive ? activeTopicRef : null
                                      }
                                    >
                                      <TopicListCard
                                        cardBgColor="!px-0"
                                        badge={
                                          <div className="flex gap-2">
                                            <p>{child?.difficulty_level}</p>
                                            <StarBadge />
                                          </div>
                                        }
                                        isActive={isChildActive}
                                        titleClassName="body-large !font-normal !text-surface-gray-subtle"
                                        metaTextClassName="body-small !font-normal text-surface-gray-muted"
                                        containerClassName="px-3 py-2 md:border"
                                        counter={{
                                          value: childIndex + 1,
                                          colorKey: childCompleted
                                            ? "success"
                                            : "info",
                                          variant: childCompleted
                                            ? "filled"
                                            : childProgress?.videoWatched ||
                                              childProgress?.notesTaken ||
                                              childProgress?.miniTestDone
                                              ? "progress"
                                              : "simple",
                                        }}
                                        features={[
                                          ...(child.data?.some(d => d.type === "video") ? [{
                                            icon: childProgress?.videoWatched ? (
                                              <CircleTickIcon
                                                size={16}
                                                variant="filled"
                                                value="true"
                                              />
                                            ) : (
                                              <VideoCamIcon
                                                variant="outline"
                                                size={16}
                                              />
                                            ),
                                            value: t("common.video"),
                                          }] : []),
                                          {
                                            icon: childProgress?.notesTaken ? (
                                              <CircleTickIcon
                                                size={16}
                                                variant="filled"
                                                value="true"
                                              />
                                            ) : (
                                              <PenIcon
                                                variant="book-pen"
                                                size={16}
                                              />
                                            ),
                                            value: t("common.notes"),
                                          },
                                          ...(child.has_mini_test !== false ? [{
                                            icon: childProgress?.miniTestDone ? (
                                              <CircleTickIcon
                                                size={16}
                                                variant="filled"
                                                value="true"
                                              />
                                            ) : (
                                              <PenIcon size={16} />
                                            ),
                                            value: t("common.minitest"),
                                          }] : []),
                                        ]}
                                        title={limitChars(child.name, 35)}
                                        onClick={() => {
                                          trackEvent("Topic Viewed", {
                                            entry_point: "scroll",
                                            section_name:
                                              fromSection?.name! ?? null,
                                            chapter_name: chapter.name,
                                            topic_name: topic.name,
                                            parent_topic_name: child.name,
                                          });
                                          handleTopicChange(chapter, child);
                                        }}
                                        bgColor={
                                          isChildActive
                                            ? "bg-[var(--color-brand)]/15 md:border-[var(--color-brand)]"
                                            : "bg-white md:border-[var(--border-gray-muted)]"
                                        }
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/* ---------------- small helpers ---------------- */

const ProgressBlock = React.memo(
  ({
    title,
    subtitle,
    icon = (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9 8.08392C8.16919 8.22435 7.37341 8.53889 6.66658 9.01118C5.67989 9.67047 4.91085 10.6075 4.45673 11.7039C4.0026 12.8003 3.88378 14.0067 4.11529 15.1705C4.3468 16.3344 4.91825 17.4035 5.75736 18.2426C6.59648 19.0818 7.66558 19.6532 8.82946 19.8847C9.99335 20.1162 11.1997 19.9974 12.2961 19.5433C13.3925 19.0892 14.3295 18.3201 14.9888 17.3334C15.4611 16.6266 15.7757 15.8308 15.9161 15H10C9.73479 15 9.48043 14.8946 9.2929 14.7071C9.10536 14.5196 9 14.2652 9 14V8.08392Z"
          fill="#192839"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2929 2.29289C13.4804 2.10536 13.7348 2 14 2C16.1217 2 18.1566 2.84285 19.6569 4.34314C21.1571 5.84344 22 7.87827 22 10C22 10.5523 21.5523 11 21 11L14 11C13.7348 11 13.4804 10.8946 13.2929 10.7071C13.1054 10.5196 13 10.2652 13 10V3Z"
          fill="#192839"
        />
      </svg>
    ),
  }: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
  }) => {
    return (
      <div className="flex items-center gap-1">
        <div>
          {/* SVG preserved */}
          {icon ?? icon}
        </div>

        <div className="text-center">
          <div className="body-large text-surface-gray-normal">
            <Text variant="body-large" weight="normal" color="gray-subtle">
              {title}
            </Text>
          </div>
          {subtitle && (
            <p className="body-small text-surface-gray-muted">{subtitle}</p>
          )}
        </div>
      </div>
    );
  },
);

const TopicListSkeleton = React.memo(() => {
  return (
    <div className="px-4 space-y-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="w-[150px] h-3.5" />
        <Skeleton className="w-[100px] h-5" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <TopicListCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});
