import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import TestSeriesShell from "@/components/layout/testSeries/TestSeriesShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <TestSeriesShell>{children}</TestSeriesShell>
    </ProtectedPage>
  );
}
