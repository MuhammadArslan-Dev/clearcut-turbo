import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import ContentShell from "@/components/layout/download-content/ContentShell";
import MathJaxScript from "@/components/features/mathjax/MathJaxScript";

export default async function ContentLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params;
  const examId = courseId;

  return (
    <ProtectedPage>
      <MathJaxScript />
      <ContentShell courseId={examId}>{children}</ContentShell>
    </ProtectedPage>
  );
}
