import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import ContentShell from "@/components/layout/download-content/ContentShell";

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
      <ContentShell courseId={examId}>{children}</ContentShell>
    </ProtectedPage>
  );
}
