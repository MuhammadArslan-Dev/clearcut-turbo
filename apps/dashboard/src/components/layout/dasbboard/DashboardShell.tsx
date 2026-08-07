// src/components/layout/DashboardShell.tsx
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: ReactNode }) {

  return (
    <div className="flex h-screen overflow-y-hidden"> {/* or remove overflow-* entirely */}

      {/* Sidebar */}
      <Sidebar />

      {children}
    </div>
  );
}