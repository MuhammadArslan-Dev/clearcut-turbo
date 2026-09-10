"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Transition } from "framer-motion";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { useParams } from "next/navigation";
import { changeCourse, MyCoursesResponse } from "@/lib/dashboard/learning";
import { useQueryClient } from "@tanstack/react-query";
import { MY_COURSES_KEY } from "@/hooks/course/useMyActiveCourses";
import dynamic from "next/dynamic";

// Same reasoning as TestSeriesShell.tsx's modal split: every one of these is
// gated behind a store flag at its render site below (or self-gates, like
// EditCourseModal/LockedContentModal), so a static import was bundling all
// of them — including PreviousModal's katex/react-markdown pull — into
// every preparation pageload whether or not the user ever opens them.
const ChapterIndexModal = dynamic(() => import("@/components/features/preparation/components/modal/ChapterIndex"), { ssr: false });
const MiniTestModal = dynamic(() => import("@/components/features/preparation/components/modal/MiniTest"), { ssr: false });
const MiniTestResultModal = dynamic(() => import("@/components/features/preparation/components/modal/MiniTestResult"), { ssr: false });
const PreparationGuideModal = dynamic(() => import("@/components/features/preparation/components/modal/GuideLine"), { ssr: false });
const PreviousModal = dynamic(() => import("@/components/features/preparation/components/modal/PreviousModal"), { ssr: false });
const ChangePaperModal = dynamic(() => import("@/components/features/preparation/components/modal/ChangePaperModal"), { ssr: false });
const EditCourseModal = dynamic(() => import("@/components/modals/course/edit-course-modal/edit-course-modal"), { ssr: false });
const PreparationPaywall = dynamic(() => import("@/components/features/PayWalls/PreparationPaywall"), { ssr: false });
const LockedContentModal = dynamic(() => import("@/components/features/PayWalls/LockedContentModal"), { ssr: false });

/* =========================
   Animation Config
========================= */

const sidebarVariants = {
  initial: { x: 0 },
  exit: { x: "-100%" },
};

const contentVariants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

const transition: Transition = {
  duration: 0.35,
  ease: "easeInOut",
};

/* =========================
   Component
========================= */

export default function PreparationShell({
  children,
}: {
  children: ReactNode;
}) {
  const { get } = useQueryParams();
  const isMobile = useIsMobile(900);
  const isTopicView = get("topic") !== null;
  const { isOpen: isOpenPaywall, mode } = usePaywallsStore();
  const { isOpen, stack, closeModal, open } = usePreparationModalStore();
  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );

  const params = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const courseId = params?.courseId as string | undefined;
    if (!courseId) return;

    // Skip the switch-active-course round trip (+ the course-list refetch it
    // triggers) when this course is already the server's active course —
    // e.g. navigating Course -> Test Series -> Course within the same
    // enrollment. Falls back to the normal call whenever we don't have this
    // cached yet, so behavior is unchanged for a genuine course switch.
    const cachedCourses = queryClient.getQueryData<MyCoursesResponse>(MY_COURSES_KEY);
    if (cachedCourses?.active_course?.group_code === courseId) return;

    changeCourse(courseId).then(() => {
      queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
    });
  }, [params?.courseId]);

  useStreakTracker();

  const { course, guideShownThisSession, setGuideShownThisSession } = usePreparationStore();

  useEffect(() => {
    if (!course) return;
    if (guideShownThisSession) return;
    if (!course.study_guide_seen) {
      setGuideShownThisSession();
      open("preparation-guide", {}, false);
    }
  }, [course, guideShownThisSession]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ================= TOPBAR ================= */}
      {isMobile ? (
        <AnimatePresence>
          {!isTopicView && (
            <motion.div
              key="topbar"
              variants={sidebarVariants}
              initial="initial"
              animate="initial"
              exit="exit"
              transition={transition}
            >
              <Topbar />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Topbar />
      )}

      {/* ================= LAYOUT ================= */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* ----------- Mobile (Animated, Always Mounted) ----------- */}
        {isMobile && (
          <>
            {/* Sidebar (always mounted) */}
            <motion.div
              key="sidebar"
              variants={sidebarVariants}
              initial="initial"
              animate={isTopicView ? "exit" : "initial"}
              transition={transition}
              className="absolute inset-0 w-full"
            >
              <Sidebar />
            </motion.div>

            {/* Content (always mounted) */}
            <motion.main
              key="content"
              variants={contentVariants}
              initial="initial"
              animate={isTopicView ? "animate" : "exit"}
              transition={transition}
              className="absolute inset-0 flex-1 overflow-y-auto pb-[10px]"
            >
              {children}
            </motion.main>
          </>
        )}

        {/* ----------- Desktop (Static) ----------- */}
        {!isMobile && (
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto -my-2 pb-[10px]">{children}</main>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      {isOpen && activeModal === "chapter-index" && <ChapterIndexModal />}
      {isOpen && activeModal === "previous-modal" && <PreviousModal />}
      {isOpen && activeModal === "mini-test" && <MiniTestModal />}
      {isOpen && activeModal === "mini-test-result" && <MiniTestResultModal />}
      {isOpen && activeModal === "preparation-guide" && (
        <PreparationGuideModal />
      )}
      {isOpen && activeModal === "change-paper" && <ChangePaperModal />}
      {/*
        Opened by BottomBar's "Add Paper". Driven by useCourseStore (not the
        preparation modal stack above) and self-gates on `mode === "edit"`, so
        mounting it unconditionally renders nothing until it is asked for.
      */}
      <EditCourseModal />
      {isOpenPaywall && mode === "preparation-paywall" && (
        <PreparationPaywall />
      )}
      <LockedContentModal />
    </div>
  );
}
