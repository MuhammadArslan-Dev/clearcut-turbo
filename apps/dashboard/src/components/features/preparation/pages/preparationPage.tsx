"use client";

import React, { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import ChapterDetailHeader from "../components/MainVideo/ChapterDetailHeader";
import VideoWrapper from "../components/MainVideo/VideoWrapper";
import RelatedContentWrapper from "../components/RelatedContent/RelatedContentWrapper";

import BottomBar from "@/components/layout/preparation/BottomBar";

import { usePreparationData } from "../hooks/usePreparationData";
import GlobalTour, { TourStep } from "../../tour/GlobalTour";
import { useUserInteractionData } from "../hooks/useUserInteractionData";
import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { usePreparationStore } from "../store/usePreparationDataStore";

/* =========================
   Reusable Layout Blocks
========================= */

function StickyMobileHeader() {
  return (
    <div className="block md:hidden shrink-0 sticky top-0 left-0 right-0 z-20 bg-white">
      <ChapterDetailHeader />
    </div>
  );
}

function DesktopHeader() {
  return (
    <div
      id="step-2"
      className="hidden md:block bg-white w-full mb-3 rounded-lg overflow-hidden max-w-[1100px]"
    >
      <ChapterDetailHeader />
    </div>
  );
}

function ScrollableContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 w-full max-w-[900px] overflow-y-auto space-y-3 py-4 md:py-0 md:px-6 pb-4">
      {children}
    </div>
  );
}

function FixedBottomBar() {
  return (
    <div
      id="step-1"
      className="shrink-0 sticky bottom-0 md:bottom-4 md:rounded-lg  overflow-hidden left-0 right-0 z-20 flex justify-center w-full"
    >
      <BottomBar />
    </div>
  );
}

/* =========================
   Page
========================= */

export default function PreparationPage({ courseId }: { courseId: string }) {
  const examId = courseId || "";
  const { isLoading, isError } = useGetCurrentCourse({ courseId });
  const { loading, error } = usePreparationData(examId);
  const { progressByTopic } = useUserInteractionData(examId);

  const searchParams = useSearchParams();
  const urlParamsApplied = useRef(false);

  const { selectedSectionId, selectedChapter, selectedTopic, selectSection } =
    usePreparationStore();

  // On first hydration, override section from URL param if provided
  useEffect(() => {
    if (urlParamsApplied.current || !selectedSectionId) return;
    const urlSection = searchParams.get("section");
    if (urlSection && Number(urlSection) !== selectedSectionId) {
      selectSection(Number(urlSection));
    }
    urlParamsApplied.current = true;
  }, [selectedSectionId]);

  // Sync store state → URL whenever section / chapter / topic changes
  useEffect(() => {
    if (!selectedSectionId) return;
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.get("section") !== String(selectedSectionId)) {
      params.set("section", String(selectedSectionId));
      changed = true;
    }
    if (selectedChapter?.id && params.get("chapter") !== String(selectedChapter.id)) {
      params.set("chapter", String(selectedChapter.id));
      changed = true;
    }
    // `useIsMobile` state is `false` on the first render after (re)mount — it
    // only becomes correct once its own effect runs. Relying on it here made the
    // mobile topic view auto-open on remount (e.g. Course → Test Series →
    // Course), because this effect would inject a `topic` param before the flag
    // corrected. Read the viewport synchronously so the guard is right on the
    // first pass. On mobile the topic view is opened explicitly by the user, so
    // never inject a `topic` param here — only keep an already-open one in sync.
    const isMobileNow = window.matchMedia("(max-width: 899px)").matches;
    const currentTopic = params.get("topic");
    if (
      selectedTopic?.id &&
      currentTopic !== String(selectedTopic.id) &&
      currentTopic !== "true" &&
      (!isMobileNow || currentTopic !== null)
    ) {
      params.set("topic", String(selectedTopic.id));
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  }, [selectedSectionId, selectedChapter?.id, selectedTopic?.id]);

  const steps: TourStep[] = [
    {
      element: "#step-1",
      popover: {
        title: "Welcome",
        description: "This is the first step",
      },
    },
    {
      element: "#step-2",
      popover: {
        title: "Next",
        description: "This is the second step",
      },
    },
  ];
  const [tourOpen, setTourOpen] = React.useState(false);

  // if (loading) return <p>Loading syllabus...</p>;
  if (error) return <p>Error loading syllabus</p>;
  
  return (
    <>
      <div className="relative h-full flex flex-col">
        {/* Mobile Header */}
        <StickyMobileHeader />

        {/* <button onClick={() => setOpen(true)}>Start Tour</button> */}
        <GlobalTour
          steps={steps}
          isOpen={tourOpen}
          onClose={() => setTourOpen(false)}
        />

        {/* ================= SCROLLABLE CONTENT ================= */}
        <div className="flex flex-col items-center  w-full h-[calc(100vh-126px)] md:max-h-[calc(100vh-6px)] md:min-h-fit overflow-auto  md:py-6">
            <DesktopHeader />
          <ScrollableContent>

            <div className="flex justify-center rounded-lg">
              <div className="max-w-[660px] w-full  overflow-x-auto">
                <VideoWrapper />
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <RelatedContentWrapper />
            </div>
          </ScrollableContent>
        </div>
        {/* ================= FIXED FOOTER ================= */}
        <FixedBottomBar />
      </div>
    </>
  );
}
