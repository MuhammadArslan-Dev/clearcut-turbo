import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import PreparationShell from "@/components/layout/preparation/PreparationShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <PreparationShell>{children}</PreparationShell>
    </ProtectedPage>
  );
}
