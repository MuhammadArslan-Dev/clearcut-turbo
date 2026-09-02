// src/components/layout/DashboardShell.tsx
"use client";
import React, { useEffect, useMemo, useRef, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import ExamEndConfirmationSheet from "@/components/features/exam/components/modals/ExamEndConfirmationSheet";
import QuestionNavigatorSheet from "@/components/features/exam/components/modals/QuestionNavigatorSheet";
import { P_QUERY_KEY } from '@/components/features/preparation/hooks/usePreparationData';
import { ExamSyllabusData } from '@/components/features/preparation/types/types';
import { getExamSyllabus } from '@/lib/preparation/preparation';
import { useQuery } from '@tanstack/react-query';
import { useContentDataStore } from "@/components/features/downloadable-content/store/useContentDataStore";
import LockedContentModal from "@/components/features/PayWalls/LockedContentModal";
import PaywallFloatingWidget from "@/components/features/PayWalls/PaywallFloatingWidget";
import BottomContentPageSwitchReveal from "@/components/features/downloadable-content/components/BottomContentPageSwitchReveal";
import NotesIndexModal from "@/components/features/downloadable-content/components/NotesIndexModal";
import { useNotesIndexStore } from "@/components/features/downloadable-content/store/useNotesIndexStore";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useScrollHideOffset } from "@/hooks/useScrollHideOffset";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Text from "@clearcut/ui/text";
import { MainLoader } from "@/components/FullScreenLoader";

// Same upper bound preparation's Sidebar uses for its own scroll-hide
// offset — Topbar clamps against its own measured height, so this only
// needs to be a safe ceiling.
const TOPBAR_MAX_HIDE_OFFSET = 150;

export default function ContentShell({ children, courseId }: { children: ReactNode; courseId: string | number | null }) {

  const { data, isLoading } = useQuery<ExamSyllabusData>({
    queryKey: P_QUERY_KEY(courseId),
    enabled: !!courseId,

    queryFn: async () => {
      const res = await getExamSyllabus(courseId as number);
      return res.data;
    },

    // staleTime: 5 * 60 * 1000,
    // gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    setData,
    setLoading,
  } = useContentDataStore();


  React.useEffect(() => {
    if (data) {
      setData(data.paper, data.sections);
    }
  }, [data, setData]);

  React.useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const { isOpen, stack } = useExamModalStore();
  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );

  // Mobile-only: hide the Topbar's title row 1:1 with how far the user has
  // scrolled the notes list, same technique as preparation's Sidebar (see
  // useScrollHideOffset) — Topbar clamps this against its own measured
  // height, so this just needs to be a safe upper bound. PaywallFloatingWidget
  // and BottomContentPageSwitchReveal below read the resulting `progress`
  // from the same store to grow into view in sync as the Topbar shrinks.
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useScrollHideOffset(scrollContainerRef, TOPBAR_MAX_HIDE_OFFSET);
  const setTopbarOffset = useTopbarVisibilityStore((s) => s.setOffset);

  useEffect(() => {
    setTopbarOffset(isMobile ? scrollOffset : 0);
  }, [isMobile, scrollOffset, setTopbarOffset]);

  // Always show the Topbar again once we leave this screen.
  useEffect(() => () => setTopbarOffset(0), [setTopbarOffset]);

  const pathname = usePathname();
  const isNotesRoute = pathname.includes("/notes");
  const t = useTranslations();
  const openIndex = useNotesIndexStore((s) => s.open);

  return (
    <div className="w-full flex justify-center bg-black/40 sm:py-6">
      <div className="max-w-[800px] h-[calc(100vh-6px)] sm:h-[calc(100vh-56px)] w-full flex flex-col overflow-hidden bg-[#f1f5fa] sm:rounded-lg">
        {/* Sidebar */}
        <div className="sticky top-0 bg-white z-20">
          <Topbar />
        </div>

        {/* Static positioning context for the bottom overlay below — same
            split preparation's Sidebar uses: THIS wrapper never scrolls,
            only <main> inside it does, so the overlay can sit fixed over the
            scrolling content via `absolute` instead of `sticky`. A `sticky`
            overlay living INSIDE the scrolling element instead (the
            previous approach here) behaved differently from preparation's
            floating widget — this restores the same mechanism. */}
        <div className="relative flex-1 overflow-hidden">
          <main ref={scrollContainerRef} className="h-full overflow-y-auto pb-40">
            {/* Hold off mounting page content (and its own loading skeleton)
                until the syllabus query above has resolved. ContentTabsBar
                (in Topbar, above this <main>) renders nothing until that
                same data arrives, then pops in a paper/section tab row —
                if page content had already painted by then, that pop-in
                pushes it down after the user may already be looking at or
                scrolling it. Waiting here means the tabs area reaches its
                final size before anything below it ever paints, so there's
                nothing left for it to push. Only gates the FIRST load of a
                course's content — react-query serves cached syllabus data
                instantly on later navigations between notes/pyqs. */}
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <MainLoader />
              </div>
            ) : (
              children
            )}
          </main>

          {/* Mirrors preparation's Sidebar bottom-fixed reveal: Notes/PYQs
              switch + payment widget, growing into view as the Topbar hides. */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 w-full space-y-2 px-3"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center items-center gap-2 w-full">
              <BottomContentPageSwitchReveal />

              {isNotesRoute && (
                <button
                  type="button"
                  onClick={openIndex}
                  className="w-[115px] h-9 shrink-0 px-2 flex gap-2 items-center justify-center rounded-sm cursor-pointer bg-[var(--icon-neutral-intense)] text-white"
                >
                  <Text className="text-white" variant="heading-small" weight="semibold">
                    {t("common.index")}
                  </Text>
                </button>
              )}
            </div>
            <PaywallFloatingWidget />
          </div>
        </div>

        {isOpen && activeModal === "end-exam" && <ExamEndConfirmationSheet />}
        {isOpen && activeModal === "exam-navigation-panel" && (
          <QuestionNavigatorSheet />
        )}
      </div>

      <LockedContentModal />
      <NotesIndexModal />
    </div>
  );
}
