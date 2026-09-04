"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/dictionary";

/**
 * EN/HI toggle **scoped to one tool** (see LocaleLink.tsx — same
 * "/tools/{tool}" public-URL scoping applies here). Always plain <a> tags,
 * not next/link — see LocaleLink.tsx for why.
 *
 * usePathname() is basePath-relative and safe on an English page (Next
 * strips "/tools" — this app's basePath — from a URL that actually starts
 * with it), but that leaves the tool's own route segment still attached
 * (e.g. "/resizer/htet"), which this strips back off to get the
 * tool-root-relative path ("/htet") the rest of this component expects. On
 * a Hindi page the real URL is /hi/tools/{tool}/*, which doesn't start with
 * that basePath at all, so usePathname() can't be trusted there — this
 * reads window.location directly instead, deferred to a client-only effect
 * (like RecentExams.tsx) so the server-rendered guess never has to be
 * corrected after hydration and mismatch-warn.
 */
export default function LocaleSwitcher({
  locale,
  tool = "resizer",
}: {
  locale: Locale;
  /** Which tool's route tree this switcher stays within. Defaults to "resizer" — every call site written before the age calculator existed relies on that default. */
  tool?: "resizer" | "age-eligibility-calculator";
}) {
  const pathname = usePathname();
  const [hiAppPath, setHiAppPath] = useState<string | null>(null);
  const hiPrefixPattern = new RegExp(`^/hi/tools/${tool}`);
  const enPrefixPattern = new RegExp(`^/${tool}`);

  useEffect(() => {
    if (locale !== "hi") return;
    setHiAppPath(window.location.pathname.replace(hiPrefixPattern, "") || "/");
    // hiPrefixPattern is a fresh RegExp each render but always equivalent for a given `tool`/`locale` pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, tool]);

  const enAppPath = pathname ? pathname.replace(enPrefixPattern, "") || "/" : null;
  const appPath = locale === "hi" ? hiAppPath : enAppPath;
  if (appPath === null) return null;

  const tabs = [
    { href: `/tools/${tool}` + (appPath === "/" ? "" : appPath), label: "EN", active: locale === "en" },
    { href: `/hi/tools/${tool}` + (appPath === "/" ? "" : appPath), label: "हिं", active: locale === "hi" },
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
