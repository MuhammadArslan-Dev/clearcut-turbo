"use client";

import { Card } from "@clearcut/ui/card";
import {
  ArrowIcon,
  ChartSuccessBarIcon,
  ClockIcon,
  FireIcon,
  NoteIcon,
  SheildIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import { Button } from "@clearcut/ui/button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Content as ContentType } from "../../types/types";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import VideoCard from "../MainVideo/VideoCard";
import { usePreparationModalStore } from "../../store/usePreparationModalStore";
import { motion } from "framer-motion";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { useTranslations } from "next-intl";
import { toLower } from "@clearcut/utils/text-format";
import Skeleton from "@clearcut/ui/skeleton";
import { trackEvent } from "@/lib/analytics/browser";
import PagesIcon from "@/components/ui/icons/page-icon";
import BellIcon from "@/components/ui/icons/Bell-icon";
import PieChartIcon from "@/components/ui/icons/pie-chart-icon";
import { GraphIcon } from "./RelatedContentWrapper";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useVideoPlayerStore } from "../../store/useVideoPlayerStore";
import {
  ContentItem,
  NoteItem,
  VideoConcept,
} from "../../types/topic-content-type";
import { useMainVideoProgressTrackerStore } from "../../store/useMainVideoProgressTracker";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  tab: string;
  notes?: NoteItem[] | null;
  bonusVideos?: ContentItem[] | null;
  concepts?: VideoConcept[] | null;
  trends?: ContentType[] | null;
}

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function Content({
  tab,
  notes,
  bonusVideos,
  concepts,
  trends,
}: Props) {
  const { open } = usePreparationModalStore();
  if (!tab) {
    return (
      <div className="bg-white p-4 space-y-3">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rectangular" height={120} />
      </div>
    );
  }

  // if (tab === "notes") return <Trends onClick={() => open("previous-modal")} />;
  if (tab === "notes") return <Notes notes={notes} />;
  if (tab === "bonus-videos") return <BonusVideo videos={bonusVideos} />;
  if (tab === "trends")
    return <Trends onClick={() => open("previous-modal")} />;
  if (tab === "concepts") return <Concepts concepts={concepts} />;

  return null;
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

export function downloadFromBackend(noteId: number) {
  window.location.href = `https://apptest.clearcutoff.in/download-note/${noteId}`;
}

export function downloadAllNotes(entityId: number) {
  window.location.href = `/api/download-notes-zip/${entityId}`;
}

/* -------------------------------------------------------------------------- */
/*                                  NOTES                                     */
/* -------------------------------------------------------------------------- */

export function Notes({ notes }: { notes?: NoteItem[] | null }) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const {
    selectedTopic,
    markTopicFieldDone,
    course,
    selectedSectionId,
    selectedChapter,
    selectedPaperId,
    sectionsByPaperId,
  } = usePreparationStore();

  const sections = selectedPaperId
    ? (sectionsByPaperId[selectedPaperId] ?? [])
    : [];

  const t = useTranslations("relatedContent.studyTabs");

  const handleDownload = (note: NoteItem) => {
    trackEvent("Notes Downloaded", {
      content_id: "Notes",
      chapter_name: selectedChapter?.name!,
      topic_name: selectedTopic?.name!,
    });

    setDownloadingId(note.id);
    downloadFromBackend(note.id);
    setTimeout(() => setDownloadingId(null), 800);
  };

  const markVideoWatch = async () => {
    await updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic?.id.toString()!,
      notes_taken: true,
    });
    trackEvent("Topic Status Changed", {
      topic_name: selectedTopic?.name!,
      new_status: "notesTaken",
      change_source: "manual_user_action",
    });
    markTopicFieldDone(Number(selectedTopic?.id), "notesTaken");
  };

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId),
    [sections, selectedSectionId],
  );

  const language = useMemo(
    () => (course?.language === "english" ? "en" : "hi"),
    [course],
  );

  const filterNotes = useMemo(() => {
    if (!notes?.length) return null;

    // Only apply language filter if section type is subject
    if (selectedSection?.type === "subject") {
      const languageNotes = notes.filter((note) => note?.language === language);

      return languageNotes[0] || notes[0]; // fallback
    }

    return notes[0];
  }, [notes, language, selectedSection]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white px-3 py-4"
    >
      <div className="flex flex-col gap-5 justify-between md:flex-row">
        {/* Left */}
        <div className="space-y-4 md:w-[50%] md:flex md:flex-col md:items-center">
          <Title
            title={t("notes.detailedTitle")}
            subtext={t("notes.detailedSubtitle")}
            className="md:text-center"
          />

          {!notes?.length ? (
            <div className="flex items-center justify-center h-20">
              <div className="flex items-center gap-2">
                <NoteIcon />
                <p className="body-medium">No Notes Available</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-2 justify-center"
            >
              <Card borderRadius={16} padding={0} width="260px">
                <div className="flex flex-col items-center gap-4 px-4 py-3">
                  <div className="flex gap-4 w-auto justify-center">
                    <div className="flex justify-center items-center">
                      <NoteIcon variant="pdf" size={44} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1 items-center">
                          <WarningCircleIcon color="#768EA7" />
                          <Text
                            as="p"
                            variant="body-small"
                            className="flex items-center gap-1"
                            color="gray-muted"
                          >
                            {t("notes.meta.language")}:{" "}
                            <StatusChip
                              variant="outline"
                              tone="info"
                              className="!text-brand !bg-brand/7 body-xsmall !font-normal !py-0.5"
                              label={language === "en" ? "English" : "Hindi"}
                            />
                          </Text>
                        </div>
                        <div className="flex gap-1 items-center">
                          <PagesIcon variant="double" mode="simple" />
                          <Text as="p" variant="body-small" color="gray-muted">
                            {t("notes.meta.pages")}:{" "}
                            <Text variant="body-small" color="gray-normal">
                              6 {toLower(t("notes.meta.pages"))}
                            </Text>
                          </Text>
                        </div>
                        <div className="flex gap-1 items-center">
                          <ClockIcon />
                          <Text as="p" variant="body-small" color="gray-muted">
                            {t("notes.meta.updatedFor")}:{" "}
                            <Text variant="body-small" color="gray-normal">
                              {course?.exam?.short_name}
                            </Text>
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full px-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => {
                          handleDownload(filterNotes as NoteItem);
                          markVideoWatch();
                        }}
                        sx={{
                          padding: "2px 12px",
                          borderRadius: "50px",
                        }}
                        size="sm"
                        fullWidth
                        variant="outlined"
                      >
                        {downloadingId ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <div className="flex gap-1">
                            <Text
                              as="p"
                              color="primary-dark"
                              weight="semibold"
                              variant="body-small"
                            >
                              {t("notes.buttons.download")}
                            </Text>
                            <ArrowIcon variant="download" color="#0083ff" />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>

              <div className="flex items-center gap-2">
                <WarningCircleIcon color="#768EA7" />
                <Text as="p" variant="body-small" color="gray-muted">
                  {t("notes.footerHint")}
                </Text>
              </div>
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="w-0.5 md:block hidden bg-gray-300"></div>

        {/* Right */}
        <div className="md:w-[50%] space-y-4 md:flex md:flex-col md:items-center">
          <Title
            title={t("notes.quickTitle")}
            subtext={t("notes.quickSubtitle")}
            className="md:text-center"
          />

          <div className="h-full w-full flex flex-col items-center justify-center gap-2">
            <div className="max-w-[240px] w-full">
              <Button
                sx={{
                  padding: "2px 12px",
                  borderRadius: "50px",
                }}
                size="sm"
                fullWidth
                variant="outlined"
              >
                <div className="flex items-center gap-1">
                  <Text
                    as="p"
                    color="primary-dark"
                    weight="semibold"
                    variant="body-small"
                  >
                    {t("notes.buttons.notify")}
                  </Text>
                  <BellIcon size={12} />
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <WarningCircleIcon color="#768EA7" />
              <Text as="p" variant="body-small" color="gray-muted">
                {t("notes.footerHint")}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TRENDS                                    */
/* -------------------------------------------------------------------------- */

export function Trends({ onClick }: { onClick: () => void }) {
  const trends = useTranslations("relatedContent.studyTabs.trends");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white p-3 md:p-4"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <Title
            title={trends("title")}
            subtext={trends("subtitle")}
            className="md:text-center"
          />

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="w-full h-full flex gap-4 lg:gap-6 flex-col lg:flex-row md:justify-between"
          >
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <FireIcon
                        variant="outline"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Topic Importance
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <FireIcon variant="red" />
                    <FireIcon
                      variant="outline"
                      color="var(--icon-gray-subtle)"
                    />
                    <FireIcon
                      variant="outline"
                      color="var(--icon-gray-subtle)"
                    />
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <PieChartIcon
                        size={24}
                        variant="bordered"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Marks Asked
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      6-9 marks
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-2 hidden md:block bg-[var(--border-gray-subtle)]" />
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <ChartSuccessBarIcon
                        width={20}
                        variant="graph-line"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Last Appeared
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      CTET 2023
                    </Text>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 items-center">
                    <div>
                      <ClockIcon
                        size={20}
                        variant="left-rotate"
                        color="var(--icon-gray-muted)"
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body-large"
                      weight="normal"
                      color="gray-subtle"
                    >
                      Questions (per exam)
                    </Text>
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <Text
                      as="p"
                      variant="body-large"
                      weight="semibold"
                      color="gray-normal"
                    >
                      3 per exam
                    </Text>
                    <Text as="p" variant="body-small" color="gray-subtle">
                      (Based on 10 year)
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={onClick}
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex gap-2 items-center">
                <p>View CTET Questions (6)</p>
                <ArrowIcon color="var(--icon-gray-normal)" variant="right" />
              </div>
            </Button>
          </motion.div>

          <div className="flex items-center gap-1">
            <SheildIcon
              size={16}
              color="#768EA7"
              mode="simple"
              variant="outline"
            />
            <Text color="gray-subtle" variant="body-small" weight="normal">
              Based on CTET PYQs (2015-2023)
            </Text>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               BONUS VIDEO                                  */
/* -------------------------------------------------------------------------- */

export function BonusVideo({ videos }: { videos?: ContentItem[] | null }) {
  const bVideo = useTranslations("relatedContent.studyTabs.bonusVideos");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white py-4"
    >
      <div className="space-y-4">
        <Title
          title={bVideo("title")}
          subtext={bVideo("subtitle")}
          className="px-3"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {videos?.map((video, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }}>
              <VideoCard url={video?.video_link!} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONCEPTS                                    */
/* -------------------------------------------------------------------------- */

function convertToSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  return 0;
}
export function Concepts({ concepts }: { concepts: VideoConcept[] }) {
  const { seekTo } = useVideoPlayerStore();
  const { currentTime } = useMainVideoProgressTrackerStore();

  const activeIndex = React.useMemo(() => {
    if (!concepts?.length) return -1;

    const times = concepts.map((c) => convertToSeconds(c.time));

    for (let i = 0; i < times.length; i++) {
      if (currentTime < times[i]) {
        return i - 1 >= 0 ? i - 1 : 0;
      }
    }

    return times.length - 1;
  }, [currentTime, concepts]);

  if (!concepts?.length) {
    return (
      <div className="bg-white p-4 space-y-3">
        <Text color="gray-subtle" variant="body-small" weight="normal">
          No concepts found
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white p-3 md:p-4"
    >
      <div className="space-y-4">
        <Title
          title="Jump to exact concept in video"
          subtext="Click on any concept for faster learning and revision"
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="flex md:flex-row justify-between flex-col gap-2 md:gap-6 max-h-[400px] overflow-y-auto"
        >
          {[0, 1].map((col) => {
            const chunkSize = Math.ceil(concepts?.length / 2);

            return (
              <div key={col} className="space-y-2 w-full">
                {concepts
                  .slice(col * chunkSize, (col + 1) * chunkSize)
                  .map((item, i) => {
                    const globalIndex = col * chunkSize + i;
                    const isActive = globalIndex === activeIndex;

                    return (
                      <motion.div
                        key={i}
                        // ref={isActive ? activeRef : null}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          show: { opacity: 1, y: 0 },
                        }}
                        onClick={() => seekTo(convertToSeconds(item.time))}
                        className={clsx(
                          "cursor-pointer flex flex-col gap-1 py-2 rounded-md transition-all",
                          "pl-3 pr-3",
                          isActive
                            ? "bg-brand/10 border-l-4 border-brand"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <div className="flex gap-6 items-center">
                          <StatusChip
                            variant="outline"
                            tone="info"
                            className={clsx(
                              "!border-none px-3 py-1 body-medium !font-semibold",
                              "!text-brand !bg-brand/9",
                            )}
                            label={item.time}
                          />

                          <Text
                            as="p"
                            variant="body-medium"
                            color={"gray-normal"}
                            weight={"normal"}
                          >
                            {item.name}
                          </Text>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TITLE                                     */
/* -------------------------------------------------------------------------- */

export function Title({
  title,
  subtext,
  className,
}: {
  title: string;
  subtext: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Text as="h6" variant="body-large" color="gray-normal" weight="semibold">
        {title}
      </Text>

      <Text as="p" variant="body-small" weight="normal" color="gray-muted">
        {subtext}
      </Text>
    </div>
  );
}
