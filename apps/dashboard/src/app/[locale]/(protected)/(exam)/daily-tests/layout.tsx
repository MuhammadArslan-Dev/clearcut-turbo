import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import DashboardShell from "@/components/layout/dasbboard/DashboardShell";

// Same shell (Sidebar + auth guard) every other top-level nav destination
// uses (see (dashboard)/dashboard/layout.tsx) — Daily Tests is a peer of
// Learn/Exams/Profile in the sidebar, not a sub-page of one of them, so it
// gets its own copy of that same wrapping rather than nesting under
// (dashboard)/dashboard (which would put it at /dashboard/daily-tests).
export default function DailyTestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <DashboardShell>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </DashboardShell>
    </ProtectedPage>
  );
}
