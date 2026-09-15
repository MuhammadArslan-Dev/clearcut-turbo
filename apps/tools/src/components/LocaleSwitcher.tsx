"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/dictionary";

const LOCALE_OPTIONS: { locale: Locale; label: string; native: string }[] = [
  { locale: "en", label: "English", native: "EN" },
  { locale: "hi", label: "हिंदी", native: "हिं" },
  { locale: "mr", label: "मराठी", native: "मरा" },
];

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Locale dropdown **scoped to one tool** (see LocaleLink.tsx — same
 * "/tools/{tool}" public-URL scoping applies here). Plain <a href>
 * navigation, not next/link — see LocaleLink.tsx for why.
 *
 * A custom listbox rather than a native <select> — the previous inline
 * EN | हिं | मरा pill row grew wider with every locale added (a 4th/5th
 * language would eventually wrap/overflow the header), and a native
 * <select>'s own dropdown panel can't be restyled cross-browser (no
 * reliable padding/hover/spacing control over its <option>s), which looked
 * out of place next to the rest of this app's design.
 *
 * The panel is rendered through a portal into document.body rather than as
 * a normal absolutely-positioned child here — SiteHeader wraps this
 * component in a container using `transform` (to vertically center it),
 * and a CSS transform creates a new stacking context for its descendants.
 * That trapped this panel's own z-index inside that local context: it
 * visually painted on top of everything (confirmed by screenshots), but
 * later, unrelated page content (e.g. a page's hero section, itself a
 * later DOM sibling with no z-index of its own) still won hit-testing at
 * that screen position, since z-index comparisons only happen *within* a
 * stacking context, not between one nested inside a transform and content
 * outside it. Every click on an option silently landed on that other
 * element instead — the option never saw the click, so it never navigated,
 * despite rendering with the exact right href the whole time. A portal
 * sidesteps this entirely by escaping the transformed ancestor's DOM
 * subtree (and therefore its stacking context) altogether.
 *
 * usePathname() is basePath-relative and safe on an English page (Next
 * strips "/tools" — this app's basePath — from a URL that actually starts
 * with it), but that leaves the tool's own route segment still attached
 * (e.g. "/resizer/htet"), which this strips back off to get the
 * tool-root-relative path ("/htet") the rest of this component expects. On
 * a Hindi/Marathi page the real URL is /hi/tools/{tool}/* or
 * /mr/tools/{tool}/*, which doesn't start with that basePath at all, so
 * usePathname() can't be trusted there — this reads window.location
 * directly instead, deferred to a client-only effect (like
 * RecentExams.tsx) so the server-rendered guess never has to be corrected
 * after hydration and mismatch-warn.
 */
export default function LocaleSwitcher({
  locale,
  tool = "resizer",
}: {
  locale: Locale;
  /** Which tool's route tree this switcher stays within. Defaults to "resizer" — every call site written before the age calculator existed relies on that default. */
  tool?: "resizer" | "age-eligibility-calculator" | "syllabus-tracker";
}) {
  const pathname = usePathname();
  const [nonEnAppPath, setNonEnAppPath] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nonEnPrefixPattern = new RegExp(`^/${locale}/tools/${tool}`);
  const enPrefixPattern = new RegExp(`^/${tool}`);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (locale === "en") return;
    setNonEnAppPath(window.location.pathname.replace(nonEnPrefixPattern, "") || "/");
    // nonEnPrefixPattern is a fresh RegExp each render but always equivalent for a given `tool`/`locale` pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, tool]);

  const updatePanelPos = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPanelPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  };

  useEffect(() => {
    if (!open) return;
    updatePanelPos();
    // Bubble-phase "click" (not "pointerdown") — a pointerdown listener
    // fires and can synchronously unmount this panel before the browser
    // gets to an option <a>'s own click-driven navigation, silently
    // swallowing the click. Bubble-phase "click" runs alongside/after the
    // same click that's already navigating, so it never races it.
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if ((e.target as HTMLElement)?.closest?.('[data-locale-panel="true"]')) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", updatePanelPos);
    window.addEventListener("scroll", updatePanelPos, true);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("resize", updatePanelPos);
      window.removeEventListener("scroll", updatePanelPos, true);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const enAppPath = pathname ? pathname.replace(enPrefixPattern, "") || "/" : null;
  const appPath = locale === "en" ? enAppPath : nonEnAppPath;
  if (appPath === null) return null;

  const options = LOCALE_OPTIONS.map(({ locale: optLocale, label, native }) => ({
    href: (optLocale === "en" ? `/tools/${tool}` : `/${optLocale}/tools/${tool}`) + (appPath === "/" ? "" : appPath),
    label,
    native,
    locale: optLocale,
  }));
  const current = options.find((o) => o.locale === locale) ?? options[0];

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-gray-subtle)] bg-white py-2 pl-3 pr-2.5 text-xs font-semibold text-text-gray-normal shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none cursor-pointer transition-colors hover:border-brand focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
      >
        <span className="text-brand">
          <GlobeIcon />
        </span>
        {current.label}
        <span className={`text-text-gray-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronIcon />
        </span>
      </button>

      {open &&
        mounted &&
        panelPos &&
        createPortal(
          <div
            role="listbox"
            data-locale-panel="true"
            style={{ position: "fixed", top: panelPos.top, right: panelPos.right }}
            className="z-[1000] w-44 overflow-hidden rounded-xl border border-[var(--color-border-gray-subtle)] bg-white py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
          >
            {options.map((option) => {
              const active = option.locale === locale;
              return (
                <a
                  key={option.locale}
                  href={option.href}
                  role="option"
                  aria-selected={active}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-primary-subtle)] text-brand font-semibold"
                      : "text-text-gray-normal hover:bg-[var(--color-background-gray-subtle)]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      active ? "bg-white text-brand" : "bg-[var(--color-background-gray-subtle)] text-text-gray-muted"
                    }`}
                  >
                    {option.native}
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {active && (
                    <span className="text-brand">
                      <CheckIcon />
                    </span>
                  )}
                </a>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
