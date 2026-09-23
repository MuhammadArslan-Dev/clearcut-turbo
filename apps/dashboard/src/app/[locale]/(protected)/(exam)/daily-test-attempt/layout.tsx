import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";

// Deliberately NOT DashboardShell (the persistent Learn/Exams/Daily
// Tests/Profile sidebar) — same reasoning as (exam)/exam/layout.tsx using
// ExamShell instead: an active test needs the full screen, not the app's
// standing nav competing for space/attention. The page itself renders its
// own timer/progress-panel chrome (see page.tsx), so no shared shell is
// needed here beyond the auth guard.
export default function DailyTestAttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedPage>{children}</ProtectedPage>;
}
