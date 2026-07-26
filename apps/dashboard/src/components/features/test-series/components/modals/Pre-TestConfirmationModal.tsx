import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { useTestSeriesModalStore } from "../../store/useTestSeriesModalStore";
import { Button } from "@clearcut/ui/button";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import Text from "@clearcut/ui/text";
import ModalHeader from "../ModalHeader";
import {
  ArrowIcon,
  ChevronIcon,
  FireIcon,
  PenIcon,
  SheildIcon,
} from "@/components/ui/icons";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import TickIcon from "@/components/ui/icons/tick-icon";
import DiscountBadgeIcon from "@/components/ui/icons/discount-badge-icon";
import CalculatorIcon from "@/components/ui/icons/calculator-icon";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { trackEvent } from "@/lib/analytics/browser";

export default function PreTestConfirmationModal() {
  const { isOpen, test, sectionId, closeModal, stack, open } =
    useTestSeriesModalStore();
  const isMobile = useIsMobile();
  const t = useTranslations("testListContent");
  const { get } = useQueryParams();

  const active = stack[stack.length - 1];
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const testType = get("testType");
  const testAny = test as any;

  const modalTitle =
    testType === "chapter-tests"
      ? t("testCard.chapterTitle", { number: test?.order! })
      : testType === "full-length-papers"
        ? t("sectionalTestModal.fullLengthTest", { number: test?.order! })
        : t("sectionalTestModal.sectionTest", { number: test?.order! });

  const modalSubtitle =
    testType === "full-length-papers"
      ? "Full-length Paper"
      : testAny?.metadata?.section_name ?? "—";

  return (
    <AnimatePresence>
      {isOpen && active === "pre-test-confirmation" && (
        <Container
          isHeader={false}
          isOpen={isOpen}
          maxWidth="md:max-w-[420px]"
          onClose={() => closeModal("pre-test-confirmation")}
        >
          <div className="bg-white min-h-[50vh] max-h-[90vh] flex flex-col justify-between">
            <ModalHeader
              title={modalTitle}
              subtitle={modalSubtitle}
              onClose={() => closeModal("pre-test-confirmation")}
            />
            <Content />
            <Footer />
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CONTENT                                   */
/* -------------------------------------------------------------------------- */

const Content = ({}: any) => {
  const t = useTranslations("testListContent");
  const { get } = useQueryParams();
  const { test } = useTestSeriesModalStore();

  const testType = get("testType");
  const testAny = test as any;

  let totalQ: number;
  let totalTime: { h: number; m: number };

  if (testType === "chapter-tests") {
    totalQ = testAny?.number_of_questions ?? 10;
    totalTime = { h: 0, m: 10 }; // chapter tests are always 10 mins
  } else if (testType === "full-length-papers") {
    totalQ = 150;
    totalTime = { h: 2, m: 30 };
  } else {
    // sectional-tests
    totalQ = testAny?.number_of_questions ?? 30;
    const mins = testAny?.total_time ? Math.round(testAny.total_time / 60) : 30;
    totalTime = { h: Math.floor(mins / 60), m: mins % 60 };
  }

  return (
    <div className="flex-1 overflow-y-scroll py-3 px-3">
      <div className="w-full flex justify-center items-center">
        <div className="flex gap-6 flex-col max-w-[300px]">
          <div className="flex flex-col gap-2">
            <Item
              icon={<PenIcon size={24} variant="pen-scale" />}
              title={
                <Text
                  as="h6"
                  variant="body-medium"
                  weight="normal"
                  color="gray-muted"
                >
                  {highlightTextUtil(
                    t("questionsInfo", { count: totalQ, marks: 1 }),
                    [totalQ.toString(), "1"],
                    "!font-semibold text-[var(--text-gray-normal)]",
                  )}
                </Text>
              }
            />
            <Item
              icon={<SandTimerIcon size={24} />}
              title={
                <Text
                  as="h6"
                  variant="body-medium"
                  weight="normal"
                  color="gray-muted"
                >
                  {totalTime.h > 0
                    ? highlightTextUtil(
                        t("sectionalTestModal.duration", {
                          hours: totalTime.h,
                          minutes: totalTime.m,
                        }),
                        [totalTime.h.toString(), totalTime.m.toString()],
                        " !font-semibold text-[var(--text-gray-normal)]",
                      )
                    : highlightTextUtil(
                        t("timeInfo", {
                          time: totalTime.m,
                        }),
                        [totalTime.h.toString(), totalTime.m.toString()],
                        " !font-semibold text-[var(--text-gray-normal)]",
                      )}
                </Text>
              }
            />
            <Item
              icon={<CalculatorIcon size={24} />}
              title={
                <Text
                  as="h6"
                  variant="body-medium"
                  weight="normal"
                  color="gray-muted"
                >
                  {highlightTextUtil(
                    t("sectionalTestModal.scoring", {
                      positive: 1,
                    }),
                    ["1"],
                    "!font-semibold text-[var(--text-gray-normal)]",
                  )}
                </Text>
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Item
              icon={<DiscountBadgeIcon size={16} />}
              title={t("sectionalTestModal.instruction.saveMark")}
            />
            <Item
              icon={
                <SheildIcon
                  variant="outline"
                  color="var(--icon-gray-muted)"
                  mode="simple"
                  size={16}
                />
              }
              title={t("sectionalTestModal.instruction.autoSave")}
            />
            <Item
              icon={
                <TickIcon
                  variant="double"
                  color="var(--icon-gray-muted)"
                  size={16}
                />
              }
              title={t("sectionalTestModal.instruction.submitAnytime")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Item = ({
  title,
  titleClass,
  iconSize = "w-5",
  icon,
}: {
  title: string | React.ReactNode;
  titleClass?: string;
  iconSize?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className={iconSize}>{icon ?? <WarningCirleIcon />}</div>
      <p className={clsx("body-medium text-surface-gray-muted", titleClass)}>
        {title}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  FOOTER                                    */
/* -------------------------------------------------------------------------- */

const Footer = ({}: any) => {
  const { test, sectionId, open, closeModal } = useTestSeriesModalStore();
  const t = useTranslations("testListContent");
  const { get } = useQueryParams();
  const { exam } = useGetCurrentCourseStore();

  const testType = get("testType");
  const buttonText =
    testType === "sectional-tests"
      ? "Start Sectional Test"
      : testType === "chapter-tests"
        ? "Start Chapter Test"
        : "Start Full-length Paper";

  return (
    <div className="sticky bottom-0 px-3 py-3 bg-white">
      <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
        <div className="flex flex-col gap-1 items-center">
          <div className="max-w-[336px] w-full">
            <Button
              onClick={() => {
                closeModal("pre-test-confirmation");
                open("test-start-countdown", {
                  test: test,
                  sectionId: sectionId,
                });
                trackEvent("Test Started", {
                  test_id: test?.id.toString(),
                  test_session_id: "ts_xyz_12345",
                });
              }}
              fullWidth
              size="lg"
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex items-center gap-2">
                <span className="">{buttonText}</span>
                <ChevronIcon size={20} type="double" variant="right" />{" "}
              </div>
            </Button>
          </div>
          <div className="flex items-center gap-1 ">
            <FireIcon
              size={16}
              variant="outline"
              color="var(--icon-gray-muted)"
            />
            <Text
              as="p"
              variant="body-small"
              weight="normal"
              color="gray-muted"
            >
              {t("sectionalTestModal.coverageNote", {
                course: exam?.short_name!,
              })}
            </Text>
          </div>
        </div>
        <div>
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={() => closeModal("pre-test-confirmation")}
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
