"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { useParams, useRouter } from "next/navigation";
import { changeCourse, MyCoursesResponse } from "@/lib/dashboard/learning";
import { isApiError } from "@/lib/api/api-error";
import { logger } from "@/lib/sentry/sentry-logger";
import { claimGuide, getCourseState, skipPracticeTest } from "@/lib/api/userState";
import { isPracticeTestEnabled } from "@/lib/experiments/practiceTestFlag";
import { useAuth } from "@/providers/AuthProvider";
import PracticeTestPromptSheet from "@/components/features/practice-test/PracticeTestPromptSheet";
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

    changeCourse(courseId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
      })
      .catch((err) => {
        // Nothing handled this rejection, so a failed switch (backend 500, a
        // dropped mobile connection) surfaced as an *unhandled* rejection
        // (Sentry CLEARCUTOFF-NEXTJS-APP-97). The page itself keeps working —
        // it's driven by the courseId in the URL, not by this call's result —
        // so this only means the server's "active course" wasn't switched.
        // A network drop/navigation-away isn't actionable; a real API failure
        // is still reported, now as a handled error with context.
        if (isApiError(err) && err.isNetworkError) return;
        logger.error(err, {
          tags: { type: "background_sync", module: "preparation-shell" },
          extra: { action: "changeCourse", courseId },
        });
      });
  }, [params?.courseId]);

  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  useStreakTracker();

  const { course, setGuideShownThisSession } = usePreparationStore();

  // The first-visit guide opens automatically ONCE per user and course, ever:
  // the backend hands the claim to exactly one caller (see
  // lib/api/userState.ts), so a second tab, browser or device - or a later
  // visit - gets `claimed: false` and the guide stays closed. The guide can
  // always be reopened by hand ("How to use this page"). If the claim request
  // fails we do NOT open it (fail closed): a duplicate auto-popup is worse than
  // a missed one, and the manual link still works.
  const guideRequestedFor = useRef<string | null>(null);
  const courseCode = course?.group_code ?? null;
  const urlCourse = typeof params?.courseId === "string" ? params.courseId : null;
  // Read at response time, so a slow claim for a course the learner has already
  // left never opens the guide over the new one. (No effect cleanup flag: React
  // strict mode runs the effect twice and would cancel the one real request.)
  const urlCourseRef = useRef(urlCourse);
  urlCourseRef.current = urlCourse;
  // A practice-test prompt that was shown after enrolment but never answered
  // (`offered`: refresh, closed tab, back) is asked again here, BEFORE the guide,
  // and can only be answered with its Take / Skip buttons. A learner who was
  // never shown it (`not_taken`), skipped it or finished it is not asked. If
  // the state can't be read we carry on (fail open), so the guide still works.
  const [practiceGate, setPracticeGate] = useState<{ course: string; status: "checking" | "open" | "done" } | null>(null);
  useEffect(() => {
    if (!courseCode || courseCode !== urlCourse) return;
    if (practiceGate?.course === courseCode) return;
    // Wait for the user so the flag can be read (a missing user is OFF, not "unknown").
    if (authLoading) return;
    setPracticeGate({ course: courseCode, status: "checking" });
    // Amplitude flag `practice_test` (phase 72): OFF / unconfirmed -> never
    // re-ask. The `offered` state is left untouched, so if the flag comes back a
    // learner who never answered is asked again.
    isPracticeTestEnabled(authUser?.uuid)
      .then((on) => (on ? getCourseState(courseCode) : null))
      .then((state) => {
        if (urlCourseRef.current !== courseCode) return;
        setPracticeGate({ course: courseCode, status: state?.practice_test_status === "offered" ? "open" : "done" });
      })
      .catch(() => {
        if (urlCourseRef.current === courseCode) setPracticeGate({ course: courseCode, status: "done" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCode, urlCourse, authLoading, authUser?.uuid]);

  const takePracticeTest = () => {
    if (courseCode) router.push(`/practice-test/${courseCode}`);
  };
  const skipPracticeFromPreparation = () => {
    if (!courseCode) return;
    void skipPracticeTest(courseCode).catch(() => {});
    setPracticeGate({ course: courseCode, status: "done" });
  };

  useEffect(() => {
    // Only for the course this URL is about: while switching courses the store
    // can briefly still hold the previous one.
    if (!courseCode || courseCode !== urlCourse) return;
    // The guide waits for the practice-test check (and prompt) of this course.
    if (practiceGate?.course !== courseCode || practiceGate.status !== "done") return;
    if (guideRequestedFor.current === courseCode) return;
    guideRequestedFor.current = courseCode;

    claimGuide(courseCode)
      .then((res) => {
        if (!res.claimed || urlCourseRef.current !== courseCode) return;
        setGuideShownThisSession();
        open("preparation-guide", {}, false);
      })
      .catch((err) => {
        if (isApiError(err) && err.isNetworkError) return;
        logger.error(err, {
          tags: { type: "background_sync", module: "preparation-shell" },
          extra: { action: "claimGuide", courseId: courseCode },
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCode, urlCourse, practiceGate]);

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
      <PracticeTestPromptSheet
        isOpen={practiceGate?.course === courseCode && practiceGate.status === "open"}
        onTake={takePracticeTest}
        onSkip={skipPracticeFromPreparation}
      />
    </div>
  );
}
