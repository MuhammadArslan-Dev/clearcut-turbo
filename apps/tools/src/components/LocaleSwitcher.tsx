"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/dictionary";

/**
 * EN/HI toggle. Always plain <a> tags, not next/link — see LocaleLink.tsx
 * for why.
 *
 * usePathname() is basePath-relative and safe on an English page (Next
 * strips "/tools/resizer" from a URL that actually starts with it). On a
 * Hindi page the real URL is /hi/tools/resizer/*, which doesn't start with
 * that basePath at all, so usePathname() can't be trusted there — this
 * reads window.location directly instead, deferred to a client-only effect
 * (like RecentExams.tsx) so the server-rendered guess never has to be
 * corrected after hydration and mismatch-warn.
 */
export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [hiAppPath, setHiAppPath] = useState<string | null>(null);

  useEffect(() => {
    if (locale !== "hi") return;
    setHiAppPath(window.location.pathname.replace(/^\/hi\/tools\/resizer/, "") || "/");
  }, [locale]);

  const appPath = locale === "hi" ? hiAppPath : pathname;
  if (appPath === null) return null;

  const tabs = [
    { href: "/tools/resizer" + (appPath === "/" ? "" : appPath), label: "EN", active: locale === "en" },
    { href: "/hi/tools/resizer" + (appPath === "/" ? "" : appPath), label: "हिं", active: locale === "hi" },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-border-gray-subtle)] bg-white p-0.5">
      {tabs.map((tab) => (
        <a
          key={tab.label}
          href={tab.href}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            tab.active ? "bg-brand text-white" : "text-text-gray-muted hover:text-text-gray-normal"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
