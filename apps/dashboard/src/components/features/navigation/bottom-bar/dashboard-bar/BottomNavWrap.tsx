"use client";

import { useMemo } from "react";
import { usePathname } from "@/i18n/navigation"; // ✅ FIX
import BottomNavigation from "./BottomNavigation";
import { mobileNav } from "@/config/navigation";

export default function BottomNavWrap() {
  const pathname = usePathname();

  const sortedNav = useMemo(
    () => [...mobileNav].sort((a, b) => b.href.length - a.href.length),
    []
  );

  const activeTab =
    sortedNav.find((item) => pathname.startsWith(item.href))?.key ?? "exams";

  return (
    <div className="md:hidden">
      <BottomNavigation value={activeTab} items={mobileNav} />
    </div>
  );
}
