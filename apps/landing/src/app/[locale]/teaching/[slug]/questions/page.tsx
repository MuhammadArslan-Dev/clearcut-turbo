import OnboardingPage from "@/components/features/onboarding/page/onboarding-page";
import React from "react";

export default async function QuestionPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  return (
    <>
      <OnboardingPage course_name={slug} />
    </>
  );
}
