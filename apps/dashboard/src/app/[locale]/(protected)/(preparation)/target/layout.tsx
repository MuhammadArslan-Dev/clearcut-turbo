import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import TargetShell from "@/components/features/target/TargetShell";

/** Target tab (phase 99): same shell pattern as Test Series, no sidebar. */
export default function TargetLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <TargetShell>{children}</TargetShell>
    </ProtectedPage>
  );
}
