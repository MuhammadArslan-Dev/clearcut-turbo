"use client";

// Client-side "Contents" navigation with scroll-spy. Watches the article's
// H2/H3 headings (by the ids injected in parseArticle) with an
// IntersectionObserver and highlights the entry currently near the top of the
// viewport. Clicking an entry smooth-scrolls to that heading.
import { useEffect, useState } from "react";
import type { TocItem } from "@/types/blog/post";

// Distance (px) below the viewport top used as the scroll-spy trigger line, so
// a heading clears the ~64px sticky header (matches the headings' `scroll-mt-24`
// that positions them on click-scroll).
const HEADER_OFFSET = 96;

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // Active = the last heading whose top has scrolled above a line just below
    // the sticky header. A rect-scan (rather than a narrow IntersectionObserver
    // band) works for short articles too, where late headings can't reach the
    // top of the viewport. A bottom-of-page guard keeps the final sections
    // highlightable even when they never scroll high enough.
    // Trigger a little below the landing offset so a heading registers as
    // active once its top is at/above the header line.
    const TRIGGER_LINE = HEADER_OFFSET + 24;
    let raf = 0;

    const compute = () => {
      raf = 0;
      let current = headings[0].id;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= TRIGGER_LINE) current = h.id;
        else break;
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = headings[headings.length - 1].id;
      setActiveId(current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // Smooth-scroll to the heading; its `scroll-mt-24` keeps it clear of the
    // sticky header. Falls back to an instant jump when the browser/user
    // prefers reduced motion.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    // Update the hash without a jump so the URL is shareable/back-navigable.
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <ul className="space-y-1 border-l border-slate-200">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                aria-current={isActive ? "location" : undefined}
                className={[
                  "-ml-px block border-l-2 py-1 transition-colors",
                  item.level === 3 ? "pl-7" : "pl-4",
                  isActive
                    ? "border-blue-600 font-medium text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                ].join(" ")}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
