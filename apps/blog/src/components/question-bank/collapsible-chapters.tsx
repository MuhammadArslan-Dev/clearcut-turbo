"use client";
import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Chapter list of a subject page (CC-165). On a phone the list is collapsed
 * so Question 1 is within a screen or two; from md up it is always open (no
 * button, plain heading).
 *
 * The chapter links are server-rendered children and stay in the HTML when
 * collapsed: they are hidden with CSS (`hidden md:block`), never unmounted or
 * lazy-loaded, so search engines still see every link. The collapsed state is
 * the initial render, so nothing shifts after hydration.
 */
export default function CollapsibleChapters({
  heading,
  toggleLabel,
  children,
}: {
  /** Desktop heading (no count). */
  heading: string;
  /** Phone button text, e.g. "Chapters in this subject (38)". */
  toggleLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();

  return (
    <div className="flex flex-col gap-2">
      <h2 className="hidden md:block heading-small !font-semibold surface-text-gray-normal">{heading}</h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex w-full items-center justify-between gap-2 py-2.5 -my-2.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md"
      >
        <span className="heading-small !font-semibold surface-text-gray-normal">{toggleLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 surface-text-gray-muted transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={listId} className={open ? "block" : "hidden md:block"}>
        {children}
      </div>
    </div>
  );
}
