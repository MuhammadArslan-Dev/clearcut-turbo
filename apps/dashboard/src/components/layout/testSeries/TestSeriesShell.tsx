// src/components/layout/DashboardShell.tsx
"use client";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useTestSeriesModalStore } from "@/components/features/test-series/store/useTestSeriesModalStore";
import AttemptHistoryModal from "@/components/features/test-series/components/modals/AttemptHistoryModal";
import PreTestConfirmationModal from "@/components/features/test-series/components/modals/Pre-TestConfirmationModal";
import SectionIndexModal from "@/components/features/test-series/components/modals/SectionIndexModal";
import CountDownModal from "@/components/features/test-series/components/modals/CountDownModal";
import ChangePaperModal from "@/components/features/test-series/components/modals/ChangePaperModal";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import ExamReportSheet from "@/components/features/exam-report/ExamReportSheet";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import PreparationPaywall from "@/components/features/PayWalls/PreparationPaywall";
import LockedContentModal from "@/components/features/PayWalls/LockedContentModal";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useTestListDataStore } from "@/components/features/test-series/store/useTestListDataStore";
import PaywallFloatingWidget from "@/components/features/PayWalls/PaywallFloatingWidget";
import { ListIcon } from "@/components/ui/icons";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";

export default function TestSeriesShell({ children }: { children: ReactNode }) {
  const { set } = useQueryParams();

   useStreakTracker({ intervalMinutes: 1 });

  const { isOpen, stack, reset, open } = useTestSeriesModalStore();
  const { indexSections } = useTestListDataStore();
  const t = useTranslations("");
  useEffect(() => {
    set({
      testType: "chapter-tests",
    });
  }, []); // always reset to chapter-tests on mount

  // Mobile-only: hide the Topbar's title row while scrolling down the test
  // list, bring it back as soon as the user scrolls up (same behavior as
  // the preparation screen — see layout/preparation/Sidebar.tsx).
  const mainRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const mainScrollDirection = useScrollDirection(mainRef);
  const setTopbarVisible = useTopbarVisibilityStore((s) => s.setVisible);
  useEffect(() => {
    if (!isMobile) return;
    setTopbarVisible(mainScrollDirection === "up");
  }, [isMobile, mainScrollDirection, setTopbarVisible]);
  useEffect(() => () => setTopbarVisible(true), [setTopbarVisible]);

  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );
  const { isOpen: isOpenPaywall, mode } = usePaywallsStore();

  const { isOpen: isOpenExam, stack: stackExam } = useExamModalStore();
  const activeModalExam = useMemo(
    () => (stackExam.length ? stackExam[stackExam.length - 1] : null),
    [stackExam],
  );
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Sidebar */}
      <Topbar />

      {/* Main column */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Only this part scrolls */}
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </main>
        {/* <Footer /> */}
      </div>

      {/* Mobile-only: Sidebar (and the Index button/PaywallFloatingWidget it
          carries) is `hidden md:flex` — the test list is the whole screen
          on mobile, there's no separate sidebar view to show them in like
          preparation's mobile layout has. Reproduced here instead, fixed to
          the bottom, so mobile users get the same access. */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 space-y-2 px-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        {!!indexSections?.length && (
          <div className="flex justify-center w-full">
            <button
              type="button"
              onClick={() => open("section-index")}
              className="w-[115px] px-3 py-2 flex gap-2 items-center justify-center rounded-sm cursor-pointer bg-[#243547] text-white"
            >
              <ListIcon size={20} variant="lines" />
              <Text className="text-white" variant="heading-small" weight="semibold">
                {t("common.index")}
              </Text>
            </button>
          </div>
        )}
        <PaywallFloatingWidget />
      </div>

      {isOpen && activeModal === "attempt-history" && <AttemptHistoryModal />}
      {isOpen && activeModal === "pre-test-confirmation" && (
        <PreTestConfirmationModal />
      )}
      {isOpen && activeModal === "test-start-countdown" && <CountDownModal />}
      {isOpen && activeModal === "section-index" && <SectionIndexModal />}
      {isOpen && activeModal === "change-paper-modal" && <ChangePaperModal />}
      {isOpenExam && activeModalExam === "exam-report" && <ExamReportSheet />}
      {isOpenPaywall && mode === "preparation-paywall" && (
        <PreparationPaywall />
      )}
      <LockedContentModal />
    </div>
  );
}
