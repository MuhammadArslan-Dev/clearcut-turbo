"use client";
import clsx from "clsx";
import { ArrowLeftRight, CirclePlus, Play } from "lucide-react";
import { ChevronIcon, ClipBoardIcon, LockIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { Button } from "@clearcut/ui/button";
import Skeleton from "@clearcut/ui/skeleton";
import React from "react";
import {
  getNextTopic,
  getPrevTopic,
  isAtFirstTopicOverall,
  isNextTopicLocked,
  usePreparationStore,
} from "@/components/features/preparation/store/usePreparationDataStore";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { limitChars } from "@clearcut/utils/text-limit";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";
import { useAddPaper } from "@/components/features/preparation/hooks/useAddPaper";
import { courseLanguageToLocale, toContentLocale } from "@/utils/text/contentLocale";
import { getLocalizedName } from "@/components/features/preparation/util/getLocalizedName";
import BottomBarV1, { type ParsedPaperName } from "./BottomBar";

/**
 * "Version 2" of the floating topic bar — contextual bottom navigation.
 *
 * `BottomBar.tsx` (Version 1) is intentionally left untouched in behaviour. To
 * go back to it, change the one import in
 * `features/preparation/pages/preparationPage.tsx` from `.../BottomBarV2` to
 * `.../BottomBar`.
 *
 * PHONES (< md, 768px): Version 1's own mobile design is rendered (with its two
 * optional mobile tweaks: icon-only Previous, play icon on the Test button).
 *
 * DESKTOP / TABLET (>= md) is driven by CONTAINER width (`@container` +
 * `@[…px]:`), not the viewport: beside the 400px sidebar the bar is ~1000px
 * wide on a 1440 screen but only ~620px on a 1024 one.
 *  - >= 960px  one row: paper zone | Previous | Test | Next
 *  - <  960px  two rows: paper zone, then Previous | Test | Next
 *  - With a Test the navigation zone is split Previous 25% | Test 50% | Next
 *    25% (a missing neighbour hands its share to the others, keeping 1 : 2 : 1
 *    between what is left); below 680px Previous/Next collapse to 48px icon
 *    buttons so the Test CTA keeps its room. Long topic names wrap inside the
 *    card (max 4 lines), capped at NAME_LIMIT_WITH_TEST (70) chars + "…".
 *
 *  - Paper zone names the selected paper ("Current Paper" + name, ellipsis and
 *    tooltip when long). Add/Change Paper logic, handler and label are unchanged.
 *  - Without a Test, Previous and Next split the zone 50% / 50% (full topic
 *    name, 2 lines at >= 680px).
 */
const NAME_LIMIT_WITH_TEST = 70;

// Same pill styling V1 used for its paper button (Button's `sx` has no Joy `px`).
const pillButtonSx = { borderRadius: "999px", paddingX: "16px" };

/**
 * Paper names arrive either as a plain string or as a JSON map of
 * `{ [locale]: { name } }` (string or already parsed). Prefer the course's
 * content locale, then any translation, then the raw string — never raw JSON.
 */
function getPaperDisplayName(
  rawName: unknown,
  contentLocale: Parameters<typeof toContentLocale>[0],
): string {
  let parsed: ParsedPaperName | null = null;
  if (rawName && typeof rawName === "object") {
    parsed = rawName as ParsedPaperName;
  } else if (typeof rawName === "string") {
    try {
      const json = JSON.parse(rawName);
      if (json && typeof json === "object") parsed = json as ParsedPaperName;
    } catch {
      return rawName;
    }
  }
  if (!parsed) return "";
  return (
    parsed[toContentLocale(contentLocale)]?.name ??
    Object.values(parsed).find((v) => v?.name)?.name ??
    ""
  );
}

export default function BottomBarV2() {
  return (
    <>
      <div className="md:hidden w-full flex justify-center">
        <BottomBarV1 iconOnlyPrev testButtonIcon />
      </div>
      <div className="hidden md:flex w-full justify-center">
        <BottomBarV2Desktop />
      </div>
    </>
  );
}

function BottomBarV2Desktop() {
  const { open } = usePreparationModalStore();
  const { goToNextTopic, goToPrevTopic } = usePreparationStore();
  const nextTopic = usePreparationStore(getNextTopic);
  const prevTopic = usePreparationStore(getPrevTopic);
  const nextTopicLocked = usePreparationStore(isNextTopicLocked);
  const isFirstTopicOverall = usePreparationStore(isAtFirstTopicOverall);
  const { open: openPaywall } = usePaywallsStore();

  const { selectedPaperId, papers, loading, selectedTopic, course } =
    usePreparationStore();
  // The course's own content language, not the site's UI locale — see
  // courseLanguageToLocale()'s docblock.
  const contentLocale = courseLanguageToLocale(course?.language);

  const { canAddPaper, openAddPaper } = useAddPaper();

  // Same query key + params as V1 / ChapterDetailHeader, so all three share one
  // cached request per topic.
  const { data: topicQuestionsCheck, isFetched: topicCheckFetched } = useQuery({
    queryKey: ["minitest-check", selectedTopic?.id],
    queryFn: async () => {
      const res = await getMiniTestQuestions(
        selectedTopic?.id,
        `?topicId=${selectedTopic?.id}&random=true&limit=1&courseId=${course?.group_code}`,
      );
      return res.data ?? [];
    },
    enabled: !!selectedTopic?.id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Optimistic until the check resolves (no layout jump when a test exists);
  // hidden completely once we know the topic has none.
  const showTest = !topicCheckFetched || (topicQuestionsCheck?.length ?? 0) > 0;

  const currentPaper = papers.find((p) => p.id === selectedPaperId);

  if (loading || !currentPaper) {
    return (
      <div className="h-[72px] max-w-[1002px] w-full flex items-center overflow-hidden px-4 py-3 bg-white">
        <div className="flex items-center gap-3 w-full">
          <div className="hidden 2md:block">
            <Skeleton variant="rectangular" width={220} height={48} borderRadius={12} />
          </div>
          <div className="flex-1">
            <Skeleton variant="rectangular" width="100%" height={48} borderRadius={12} />
          </div>
          <div className="flex-1">
            <Skeleton variant="rectangular" width="100%" height={48} borderRadius={12} />
          </div>
          <div className="flex-1">
            <Skeleton variant="rectangular" width="100%" height={48} borderRadius={12} />
          </div>
        </div>
      </div>
    );
  }

  const paperAction: PaperAction = canAddPaper
    ? "add"
    : papers.length > 1
      ? "change"
      : null;

  return (
    <BottomBarV2View
      paperAction={paperAction}
      hasPrev={!isFirstTopicOverall}
      hasNext={nextTopicLocked || !!nextTopic}
      nextLocked={nextTopicLocked}
      showTest={showTest}
      currentPaperName={getPaperDisplayName(currentPaper.name, contentLocale)}
      prevName={prevTopic ? getLocalizedName(prevTopic, contentLocale) : ""}
      nextName={nextTopic ? getLocalizedName(nextTopic, contentLocale) : ""}
      onPaperClick={paperAction === "add" ? openAddPaper : () => open("change-paper")}
      onPrev={goToPrevTopic}
      onNext={goToNextTopic}
      onUnlock={() => {
        if (course?.exam) {
          openPaywall(
            "topic-locked-modal",
            course.exam,
            "next_button_clicked",
            course,
          );
        }
      }}
      onStartTest={() => open("mini-test", {}, true)}
    />
  );
}

export type PaperAction = "add" | "change" | null;

type ViewProps = {
  paperAction: PaperAction;
  hasPrev: boolean;
  hasNext: boolean;
  nextLocked: boolean;
  showTest: boolean;
  /** Display name of the selected paper, shown on the paper card. */
  currentPaperName: string;
  prevName: string;
  nextName: string;
  onPaperClick: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUnlock: () => void;
  onStartTest: () => void;
};

// Tailwind only generates classes it can see literally, so the container-query
// variants are spelled out per mode instead of being interpolated.
const NEIGHBOUR_MODES = {
  // With a Test: Previous 25% | Test 50% | Next 25% of the navigation zone
  // (grow ratios 1 : 2 : 1); icon-only while the bar is too narrow for that.
  fixed: {
    card: "w-12 flex-none @[680px]:w-auto @[680px]:flex-[1_1_0%]",
    text: "hidden @[680px]:flex",
  },
  // No Test: the neighbours share the row, labels always visible.
  full: { card: "flex-1", text: "flex" },
} as const;
type NeighbourMode = keyof typeof NEIGHBOUR_MODES;

/** Pure layout — no store/network access, so every combination can be previewed. */
export function BottomBarV2View({
  paperAction,
  hasPrev,
  hasNext,
  nextLocked,
  showTest,
  currentPaperName,
  prevName,
  nextName,
  onPaperClick,
  onPrev,
  onNext,
  onUnlock,
  onStartTest,
}: ViewProps) {
  const isMobile = useIsMobile();
  const changeP = useTranslations("modals.changePaper");
  const addP = useTranslations("modals.addPaper");
  const actions = useTranslations("actions");
  const t = useTranslations("modals");

  const neighbourMode: NeighbourMode = showTest ? "fixed" : "full";
  const nameFor = (name: string) =>
    showTest ? limitChars(name, NAME_LIMIT_WITH_TEST) : name;

  if (!paperAction && !hasPrev && !hasNext && !showTest) return null;

  return (
    <div className="@container w-full max-w-[1002px]">
      <div className="min-h-[72px] flex flex-col gap-2 px-3 py-2 @[960px]:flex-row @[960px]:items-stretch @[960px]:gap-3 @[960px]:px-4 md:rounded-xl md:border md:border-brand bg-white">
        {paperAction && (
          <div className="flex items-center justify-between gap-3 @[960px]:flex-none @[960px]:justify-start @[960px]:border-r @[960px]:border-gray-200 @[960px]:pr-3">
            {currentPaperName && (
              <div
                className="flex min-w-0 items-center gap-2"
                title={`${changeP("current_paper")}: ${currentPaperName}`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--color-primary-subtle)] text-brand">
                  <ClipBoardIcon size={22} />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="body-small truncate !font-normal text-surface-gray-muted">
                    {changeP("current_paper")}
                  </span>
                  <span className="body-medium truncate !font-semibold text-surface-gray-normal @[960px]:max-w-[170px]">
                    {currentPaperName}
                  </span>
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="outlined"
              sx={pillButtonSx}
              onClick={onPaperClick}
              className="shrink-0"
            >
              <span className="flex items-center gap-1.5">
                {paperAction === "add" ? (
                  <CirclePlus size={16} />
                ) : (
                  <ArrowLeftRight size={16} />
                )}
                <span className="body-small !font-semibold">
                  {paperAction === "add" ? addP("title") : changeP("change_paper")}
                </span>
              </span>
            </Button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-stretch gap-2 @[680px]:gap-3">
          {hasPrev && (
            <TopicNavCard
              onClick={onPrev}
              direction="prev"
              label={actions("previous_topic")}
              shortLabel={t("miniTest.buttons.previous")}
              name={nameFor(prevName)}
              clamp={showTest}
              mode={neighbourMode}
            />
          )}

          {showTest && (
            <div className="min-w-0 flex-1 self-center @[680px]:flex-[2_1_0%]">
              <Button
                onClick={onStartTest}
                size={isMobile ? "md" : "lg"}
                sx={{ borderRadius: "12px" }}
                className="min-h-[48px] @[680px]:!min-h-[56px]"
                fullWidth
              >
                <span className="flex items-center justify-center gap-2 text-left">
                  <span className="grid size-6 @[680px]:size-7 shrink-0 place-items-center rounded-full bg-white text-brand">
                    <Play size={12} fill="currentColor" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="body-medium !font-semibold">
                      {t("miniTest.buttons.start_topic_test")}
                    </span>
                    <span className="hidden @[680px]:block body-small !font-normal opacity-90">
                      {t("miniTest.buttons.quick_practice")}
                    </span>
                  </span>
                </span>
              </Button>
            </div>
          )}

          {hasNext &&
            (nextLocked ? (
              // Same paywall trigger as V1 / the locked chapter card in
              // Sidebar.tsx, in the Next slot's shape.
              <TopicNavCard
                onClick={onUnlock}
                direction="next"
                label={actions("unlock")}
                shortLabel={actions("unlock")}
                mode="full"
                locked
              />
            ) : (
              <TopicNavCard
                onClick={onNext}
                direction="next"
                label={actions("next_topic")}
                shortLabel={actions("next")}
                name={nameFor(nextName)}
                clamp={showTest}
                mode={neighbourMode}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopicNavCard({
  onClick,
  direction,
  label,
  shortLabel,
  name,
  clamp,
  locked,
  mode,
}: {
  onClick: () => void;
  direction: "prev" | "next";
  label: string;
  /** Shown while stacked (< 800px) where the full label would not fit. */
  shortLabel: string;
  name?: string;
  /** One line + ellipsis (true) vs. up to two lines from 800px (false). */
  clamp?: boolean;
  locked?: boolean;
  mode: NeighbourMode;
}) {
  const cfg = NEIGHBOUR_MODES[mode];
  const chevron = (
    <span className="shrink-0">
      <ChevronIcon type="double" variant={direction === "prev" ? "left" : "right"} color="black" />
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "min-w-0 min-h-[48px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 cursor-pointer",
        locked
          ? "flex-none min-w-[104px] @[680px]:w-auto @[680px]:flex-[1_1_0%] border-2 border-brand bg-white text-brand"
          : ["bg-[var(--background-gray-subtle)] hover:bg-[var(--color-gray-bg-soft-hover)]", cfg.card],
      )}
    >
      {direction === "prev" && chevron}
      <span
        className={clsx(
          "min-w-0 flex-col items-center text-center",
          locked ? "flex" : cfg.text,
        )}
      >
        <span className="body-small !font-semibold @[680px]:hidden">{shortLabel}</span>
        <span className="body-small hidden @[680px]:block !font-semibold whitespace-nowrap">
          {label}
        </span>
        {name && (
          <span className="block max-w-full body-small !font-normal text-surface-gray-muted">
            <span
              className={
                clamp
                  ? "block break-words line-clamp-4"
                  : "block truncate @[680px]:whitespace-normal @[680px]:line-clamp-2"
              }
            >
              {name}
            </span>
          </span>
        )}
      </span>
      {locked ? <LockIcon size={20} color="var(--color-brand)" /> : direction === "next" && chevron}
    </button>
  );
}
