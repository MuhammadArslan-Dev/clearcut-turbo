import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";

// Full-screen like the Daily Test attempt (no DashboardShell nav): the
// one-time practice test shown between subject selection and Preparation.
export default function PracticeTestLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage>{children}</ProtectedPage>;
}
