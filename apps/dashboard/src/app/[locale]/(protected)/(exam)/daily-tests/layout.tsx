import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import DashboardShell from "@/components/layout/dasbboard/DashboardShell";
import BottomNavWrap from "@/components/features/navigation/bottom-bar/dashboard-bar/BottomNavWrap";

// Same shell (Sidebar + auth guard) every other top-level nav destination
// uses (see (dashboard)/dashboard/layout.tsx), at the top-level /daily-tests
// URL. Learn stays highlighted in the sidebar / bottom bar via
// activePrefixes in config/navigation.ts. pb-20 keeps content clear of the
// fixed mobile bottom bar.
export default function DailyTestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <DashboardShell>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
          <BottomNavWrap />
        </main>
      </DashboardShell>
    </ProtectedPage>
  );
}
