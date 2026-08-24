// src/components/layout/DashboardShell.tsx
"use client";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomPageSwitchReveal from "@/components/features/preparation/components/BottomPageSwitchReveal";
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
import { useScrollHideOffset } from "@/hooks/useScrollHideOffset";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useTestListDataStore } from "@/components/features/test-series/store/useTestListDataStore";
import PaywallFloatingWidget from "@/components/features/PayWalls/PaywallFloatingWidget";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";

// Safe upper bound for the scroll-hide offset — Topbar clamps this against
// its own measured title-row height, so this just needs to comfortably
// cover it across locales/screen sizes.
const TOPBAR_MAX_HIDE_OFFSET = 150;

export default function TestSeriesShell({ children }: { children: ReactNode }) {
  const { get, set } = useQueryParams();

   useStreakTracker({ intervalMinutes: 1 });

  const { isOpen, stack, reset, open } = useTestSeriesModalStore();
  const { indexSections } = useTestListDataStore();
  const t = useTranslations("");
  useEffect(() => {
    // Only default testType when it's missing (e.g. a bare sidebar link) —
    // testListPage renders nothing when testType is absent, so this is a
    // real fallback, not decoration. Unconditionally overwriting it here
    // used to race the report-modal redirect's own router.replace() (see
    // testListPage's showReport/examId effect): both effects build their
    // next URL from the same pre-navigation searchParams snapshot, so
    // whichever committed second re-applied its own stale copy of
    // showReport/examId and clobbered the other's testType — reopening the
    // report modal (with the wrong tab) on the very next refresh, for any
    // testType other than "chapter-tests" (the one value this effect used
    // to always force, which is why chapter tests never showed the bug).
    if (!get("testType")) {
      set({
        testType: "chapter-tests",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile-only: hide the Topbar's title row 1:1 with how far the user has
  // scrolled the test list (see useScrollHideOffset) — same behavior as the
  // preparation screen, see layout/preparation/Sidebar.tsx.
  const mainRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const mainScrollOffset = useScrollHideOffset(mainRef, TOPBAR_MAX_HIDE_OFFSET);
  const setTopbarOffset = useTopbarVisibilityStore((s) => s.setOffset);
  useEffect(() => {
    setTopbarOffset(isMobile ? mainScrollOffset : 0);
  }, [isMobile, mainScrollOffset, setTopbarOffset]);
  useEffect(() => () => setTopbarOffset(0), [setTopbarOffset]);

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
        <div className="flex justify-center items-center gap-2 w-full">
          {/* Course/Test Series switch — lives in Topbar's title row, which
              hides on scroll-down (see the effect above). Mirrored here so
              it's still reachable while scrolled, growing in exact sync
              with how much the top one has hidden instead of a separate
              fixed-duration animation. */}
          <BottomPageSwitchReveal />

          {!!indexSections?.length && (
            <button
              type="button"
              onClick={() => open("section-index")}
              className="w-[115px] h-9 shrink-0 px-2 flex gap-2 items-center justify-center rounded-sm cursor-pointer bg-[#243547] text-white"
            >
              <Text className="text-white" variant="heading-small" weight="semibold">
                {t("common.index")}
              </Text>
            </button>
          )}
        </div>
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
