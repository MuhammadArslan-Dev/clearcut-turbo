import React from "react";
import DashboardShell from "@/components/layout/dasbboard/DashboardShell";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
type ProfilePageProps = {
  children: React.ReactNode;
};
export default function DashboardLayout({ children }: ProfilePageProps) {
  return (
    <ProtectedPage>
     
      <DashboardShell>{children}</DashboardShell>
    </ProtectedPage>
  );
}
