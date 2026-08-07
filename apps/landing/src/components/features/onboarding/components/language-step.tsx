"use client";

import MainAppLogo from "@/components/icons/main-app-logo";
import Text from "@clearcut/ui/text";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { logAmplitudeEvent } from "@/services/analytics";
import { useAssessmentStore } from "@/store/assessmentStore";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

export default function LanguageStep() {
  const { next } = useAssessmentStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const course = searchParams.get("course");
    if (course) {
      localStorage.setItem("UPCOMING_COURSE", course);
    }
  }, []);

  const handleContinue = async () => {
    await logAmplitudeEvent("Language selection", {
      source: "onboarding",
      selected: "en",
    });
    next();
  };

  return (
    <div className="w-full h-[calc(100vh-2px)] sm:h-screen flex justify-center pt-20 bg-white">
      <div className="sm:max-w-[700px] h-full sm:h-auto w-full flex flex-col gap-4 px-4">
        <div className="bg-white">
          <div className="flex flex-col text-center justify-center py-4">
            <Text as="h5" variant="heading-xlarge" weight="semibold">
              Welcome to
            </Text>
            <div className="flex justify-center">
              <MainAppLogo width={190} height={48} />
            </div>
          </div>

          <div className="flex flex-col text-center justify-center py-4">
            <Text as="h5" variant="heading-xlarge" weight="semibold">
              Choose Language
            </Text>
            <Text as="p" variant="body-medium" color="gray-muted">
              You can change this anytime
            </Text>
          </div>
        </div>

        <div className="fixed sm:static bottom-0 left-0 px-3 sm:flex w-full justify-center">
          <div className="w-full sm:mb-0 mb-3">
            <ContinueFreeButton
              fullWidth
              text="Continue"
              onClick={handleContinue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
