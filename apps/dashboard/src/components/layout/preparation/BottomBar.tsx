"use client";
import { ChevronIcon, CircleIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { Button } from "@clearcut/ui/button";
import Skeleton from "@clearcut/ui/skeleton";
import React, { useMemo } from "react";
import {
  getNextTopic,
  getPrevTopic,
  usePreparationStore,
} from "@/components/features/preparation/store/usePreparationDataStore";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { limitChars } from "@clearcut/utils/text-limit";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useQuery } from "@tanstack/react-query";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";

// `px: 2` was Joy `sx` shorthand (2 x Joy's 8px spacing unit = 16px inline
// padding). The shared Button's sx supports paddingX/paddingY but not Joy's `px`,
// which would be dropped as an unknown inline-style key. Converted explicitly.
const pillButtonSx = {
  borderRadius: "999px",
  paddingX: "16px",
};

export type ParsedPaperName = Record<string, { name: string }>;

export default function BottomBar() {
  const isMobile = useIsMobile();
  const { open } = usePreparationModalStore();
  const { goToNextTopic, goToPrevTopic } = usePreparationStore();
  const nextTopic = usePreparationStore(getNextTopic);
  const prevTopic = usePreparationStore(getPrevTopic);
  const changeP = useTranslations("modals.changePaper");
  const actions = useTranslations("actions");
  const t = useTranslations("modals");
  const { locale } = useLanguageSwitch();

  const { selectedPaperId, papers, selectPaper, loading, selectedTopic, course } =
    usePreparationStore();

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

  const showTopicTestButton = !topicCheckFetched || (topicQuestionsCheck?.length ?? 0) > 0;

  const currentPaper = useMemo(() => {
    return papers.find((p) => p.id === selectedPaperId);
  }, [selectedPaperId, papers]);

  const parsedName = useMemo<ParsedPaperName>(() => {
    if (!currentPaper?.name) return {};

    if (typeof currentPaper.name === "object") {
      return currentPaper.name as ParsedPaperName;
    }

    try {
      return JSON.parse(currentPaper.name) as ParsedPaperName;
    } catch {
      return {};
    }
  }, [currentPaper?.name]);

  const localizedName = parsedName[locale]?.name ?? currentPaper?.name ?? "";

  // 🦴 Skeleton UI instead of null
  if (loading || !currentPaper) {
    return (
      <div className="h-[72px] max-w-[1002px] w-full flex items-center overflow-hidden  px-4 py-3 bg-white">
        <div className="flex items-center justify-between w-full">
          {/* Left block */}

          <div className="hidden 2md:flex items-center gap-3 bg-[var(--color-primary-subtle)] rounded-md px-4 py-2">
            <Skeleton
              variant="text"
              width={220}
              height={28} borderRadius={6}
            />
            <Skeleton variant="circular" width={32} height={32} />
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex flex-col gap-1">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={100} />
            </div>
          </div>

          {/* Mini test button */}
          <Skeleton
            variant="rectangular"
            width={160}
            height={40} borderRadius={999}
          />

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={100} />
            </div>
            <Skeleton variant="circular" width={32} height={32} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-h-[72px] max-w-[1002px] md:rounded-xl w-full flex items-center px-4 py-2 md:border md:border-brand bg-white">
      <div className="flex items-center justify-between w-full">
        {papers.length > 1 && (
          <div className="hidden 2md:flex items-center gap-3 bg-[var(--color-primary-subtle)] rounded-md px-4 py-3">
            <Text
              as="span"
              variant="body-large"
              weight="normal"
              color="gray-muted"
              className="hidden 2lg:block truncate"
            >
              {highlightTextUtil(
                `${changeP("title")} : ${localizedName}`,
                [localizedName],
                "body-large text-surface-gray-subtle !font-semibold",
              )}
            </Text>

            <Button
              size="sm"
              variant="outlined"
              sx={pillButtonSx}
              onClick={() => open("change-paper")}
            >
              <div className="flex items-center gap-2">
                <span className="body-small !font-semibold hidden lg:block">
                  {changeP("title")}
                </span>
                <CircleIcon size={20} color="#0083ff" />
              </div>
            </Button>
          </div>
        )}

        {/* <div className="w-2 bg-gray-300"></div> */}

        <div className="flex flex-col items-center h-full">
          <div>
            <Button
              onClick={goToPrevTopic}
              sx={{ padding: "0px 12px 0px 10px", borderRadius: "50px" }}
              variant="soft"
              size="sm"
              color="gray"
            >
              <div className="flex items-center gap-1.5">
                <ChevronIcon type="double" variant="left" color="black" />
                <span className="body-small !font-semibold block md:hidden">
                  Prev
                </span>
                <span className="body-small !font-semibold hidden md:block">
                  {actions("previous_topic")}
                </span>
              </div>
            </Button>
          </div>
          <h6 className="body-medium truncate hidden md:block w-12 xs:w-auto md:w-12 1xl:w-auto !font-normal text-surface-gray-normal">
            {prevTopic ? limitChars(prevTopic.name, 17) : ""}
          </h6>
        </div>

        {showTopicTestButton && (
          <div className="max-w-[200px] w-full">
            <Button
              onClick={() => open("mini-test", {}, true)}
              size={isMobile ? "md" : "lg"}
              sx={{
                borderRadius: "50px",
              }}
              fullWidth
            >
              <p>{t("miniTest.buttons.start_topic_test")}</p>
            </Button>
          </div>
        )}

        <div className="flex items-center flex-col">
          <div>
            <Button
              sx={{ padding: "6px 12px 5px 12px", borderRadius: "50px" }}
              onClick={goToNextTopic}
              variant="soft"
              size="sm"
              color="gray"
            >
              <div className="flex items-center gap-1.5">
                <span className="body-small !font-semibold block md:hidden">
                  Next
                </span>
                <span className="body-small !font-semibold hidden md:block">
                  {actions("next_topic")}
                </span>
                <ChevronIcon variant="right" type="double" color="black" />
              </div>
            </Button>
          </div>
          <h6 className="body-medium hidden md:block  truncate w-12 xs:w-auto md:w-12 1xl:w-auto !font-normal text-surface-gray-normal">
            {nextTopic ? limitChars(nextTopic.name, 17) : ""}
          </h6>
        </div>
      </div>
    </div>
  );
}
