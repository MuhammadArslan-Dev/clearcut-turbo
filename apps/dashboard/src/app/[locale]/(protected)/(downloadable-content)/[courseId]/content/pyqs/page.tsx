import PaperPage from "@/components/features/downloadable-content/pages/paper-page";
import React from "react";

export default async function page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const examId = courseId;
  return (
      <PaperPage examId={examId}  />
  );
}
