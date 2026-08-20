"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Transition } from "framer-motion";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import {
  ChapterIndexModal,
  MiniTestModal,
  MiniTestResultModal,
  PreparationGuideModal,
} from "@/components/features/preparation/components/modal";
import PreviousModal from "@/components/features/preparation/components/modal/PreviousModal";
import ChangePaperModal from "@/components/features/preparation/components/modal/ChangePaperModal";
import EditCourseModal from "@/components/modals/course/edit-course-modal/edit-course-modal";
import { usePreparationStore } from "@/components/features/preparation/store/usePreparationDataStore";
import PreparationPaywall from "@/components/features/PayWalls/PreparationPaywall";
import LockedContentModal from "@/components/features/PayWalls/LockedContentModal";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { useParams } from "next/navigation";
import { changeCourse, MyCoursesResponse } from "@/lib/dashboard/learning";
import { useQueryClient } from "@tanstack/react-query";
import { MY_COURSES_KEY } from "@/hooks/course/useMyActiveCourses";

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
