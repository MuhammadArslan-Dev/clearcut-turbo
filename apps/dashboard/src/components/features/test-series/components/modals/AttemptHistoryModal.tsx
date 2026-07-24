import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import {
  ArrowIcon,
  ChartSuccessBarIcon,
  ChevronIcon,
  StarBadge,
} from "@/components/ui/icons";
import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";
import { Button } from "@mui/joy";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import ModalHeader from "../ModalHeader";
import { Attempt, getAttemptsHistory } from "@/lib/tests/getExam";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTestListDataStore } from "../../store/useTestListDataStore";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";

export default function AttemptHistoryModal() {
  const { isOpen, closeModal, stack, open, test, sectionId } =
    useTestSeriesModalStore();
  const t = useTranslations("testListContent");
  const { papers, paper, setPaper } = useTestListDataStore();
  const { get } = useQueryParams();

  const testType = get("testType");

  const isMobile = useIsMobile();
  const { courseId } = useParams();

  /* =======================
     Query
  ======================== */

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [
      "test-attempt-history",
      test?.id,
      courseId,
      sectionId,
      paper?.id,
    ],

    enabled: !!test?.id,

    queryFn: async () => {
      const res = await getAttemptsHistory(
        `course_id=${courseId}&paper_id=${paper?.id}&test_id=${test?.id}&section_id=${sectionId}&type=${testType === "sectional-tests" ? "sectional" : testType === "chapter-tests" ? "chapter" : "full-length"}`,
      );

      return res.data;
    },

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  /* =======================
     Modal State
  ======================== */

  const active = stack[stack.length - 1];

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const handleClose = () => {
    closeModal("attempt-history");
  };

  if (!isOpen || active !== "attempt-history") return null;

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[400px]"
        onClose={() => handleClose()}
      >
        <div className="bg-white min-h-[20vh] max-h-[90vh] flex flex-col justify-between gap-2">
          {/* Header */}
          <ModalHeader
            title={
              testType === "chapter-tests"
                ? t("testCard.chapterTitle", { number: test?.order! })
                : testType === "full-length-papers"
                  ? t("sectionalTestModal.fullLengthTest", { number: test?.order! })
                  : t("sectionalTestModal.sectionTest", { number: test?.order! })
            }
            subtitle={
              testType === "chapter-tests"
                ? `${(test as any)?.metadata?.section_name ?? ""} > ${(test as any)?.metadata?.chapter_name ?? ""}`
                : testType === "sectional-tests"
                  ? ((test as any)?.metadata?.section_name ?? "")
                  : undefined
            }
            onClose={() => handleClose()}
          />

          {/* Content */}
          {isLoading ? (
            <ContentSkeleton />
          ) : (
            <Content onClick={()=>handleClose()} data={data} />
          )}

          {/* Footer */}
          <Footer
            close={() => handleClose()}
            retakeTest={() => {
              handleClose();

              open("pre-test-confirmation", {
                test: test,
                sectionId: sectionId,
              });
            }}
          />
        </div>
      </Container>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CONTENT                                   */
/* -------------------------------------------------------------------------- */

const Content = ({
  data,
  onClick = () => {},
}: {
  data: any | undefined;
  onClick?: () => void;
}) => {
  const { open, closeModal } = useExamModalStore();

  return (
    <div className="flex-1 overflow-y-scroll px-3">
      <div className="flex gap-4 flex-col">
        {data && data.length > 0 ? (
          data.map((test: any, index: number) => {
            return (
              <TestItem
                key={index}
                index={index + 1}
                score={`${test.result?.correct ?? 0} / ${test.result?.total_questions ?? 0}`}
                buttonText="View Report"
                onClick={() => {
                  onClick();
                  open("exam-report", {
                    examId: test.uuid!,
                  });
                }}
              />
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-6">
            No attempts found.
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SKELETON UI                                  */
/* -------------------------------------------------------------------------- */

const ContentSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-scroll px-3">
      <div className="flex gap-4 flex-col animate-pulse">
        {[1, 2, 3].map((item) => (
          <Card key={item} padding={0}>
            <div className="py-3 px-4">
              <div className="flex justify-between">
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>

                <div className="h-8 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                TEST ITEM                                   */
/* -------------------------------------------------------------------------- */

const TestItem = ({
  index,
  score,
  buttonText,
  onClick,
}: {
  index: number;
  score: string | number;
  buttonText: string | React.ReactNode;
  onClick?: () => void;
}) => {
  const t = useTranslations("testListContent");

  return (
    <Card
      padding={0}
      borderwidth={2}
      bordercolor="var(--border-gray-muted)"
    >
      <div className="py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <Text as="p" variant="body-medium" weight="semibold">
                {t("sectionalTestAttempts.attempt", { number: index })} :
              </Text>

              <Text as="p" variant="body-medium" weight="normal">
                {score}
              </Text>
            </div>

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
          </div>

          <div>
            <Button
              sx={{
                borderRadius: "50px",
              }}
              onClick={onClick}
              variant="soft"
              color="gray"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <span className="">{buttonText}</span>
                <ChartSuccessBarIcon
                  color="var(--icon-gray-normal)"
                  width={12}
                  variant="graph-bar"
                />{" "}
              </div>{" "}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  FOOTER                                    */
/* -------------------------------------------------------------------------- */

const Footer = ({
  retakeTest,
  close,
}: {
  retakeTest: () => void;
  close: () => void;
}) => {
  const t = useTranslations("testListContent");
  const { get } = useQueryParams();

  const testType = get("testType");
  const buttonText =
    testType === "chapter-tests"
      ? "Chapter Test"
      : testType === "full-length-papers"
        ? "Paper"
        : "Test";
  return (
    <div className="sticky bottom-0 px-3 py-3 bg-white">
      <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
        <div className="flex flex-col gap-1 items-center">
          <div className="max-w-[336px] w-full">
            <Button
              onClick={() => retakeTest()}
              fullWidth
              size="lg"
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex items-center gap-2">
                <span className="">
                  {t("sectionalTestAttempts.reattemptButton", {
                    type: buttonText,
                  })}
                </span>
                <ChevronIcon size={20} type="double" variant="right" />{" "}
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <WarningCirleIcon />

            <Text
              as="p"
              variant="body-small"
              weight="normal"
              color="gray-muted"
            >
              {t("sectionalTestAttempts.reattemptNote")}
            </Text>
          </div>
        </div>

        <div>
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={() => close()}
            sx={{ borderRadius: "50px" }}
          >
            <div className="flex items-center gap-1">
              <ArrowIcon size={20} variant="left" />{" "}
              <span className="">{t("goBack")}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
