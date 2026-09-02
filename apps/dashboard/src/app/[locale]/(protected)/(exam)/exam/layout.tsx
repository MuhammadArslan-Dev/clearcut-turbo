import React from "react";
import ExamShell from "@/components/layout/exam/ExamShell";
import ProtectedPage from "@/components/features/auth/ProtectedPage";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <ExamShell>{children}</ExamShell>
    </ProtectedPage>
  );
}
