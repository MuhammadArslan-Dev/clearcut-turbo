import React from "react";
import ExamShell from "@/components/layout/exam/ExamShell";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import MathJaxScript from "@/components/features/mathjax/MathJaxScript";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <MathJaxScript />
      <ExamShell>{children}</ExamShell>
    </ProtectedPage>
  );
}
