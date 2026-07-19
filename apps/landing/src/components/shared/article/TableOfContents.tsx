"use client";

import { useEffect, useState } from "react";
import Text from "@clearcut/ui/text";
import clsx from "clsx";

export type TocItem = { id: string; text: string };

// Distance (px) below the viewport top used as the scroll-spy trigger line,
// clearing the sticky header (matches the ~96px scroll-mt on headings).
const HEADER_OFFSET = 96;

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // Active = the last heading whose top has scrolled above the trigger
    // line. A rect-scan (rather than IntersectionObserver) also works for
    // short articles, where late headings never reach the top of the
    // viewport — a bottom-of-page guard highlights the final section once
    // you've scrolled all the way down, even then.
    const TRIGGER_LINE = HEADER_OFFSET + 24;
    let raf = 0;

    const compute = () => {
      raf = 0;
      let current = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= TRIGGER_LINE) current = heading.id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  if (!items.length) return null;

  return (
    // The outer <aside> is the grid item (stretches to the full row height,
    // no sticky). The inner <nav> is the actual sticky element, sized to its
    // own (short) content — sticky has no room to move when an element's
    // height already equals its containing block's height, so the sticky
    // element must stay shorter than the stretched wrapper around it.
    <aside className="hidden lg:block">
      <nav aria-label="Table of contents" className="sticky top-24">
        <Text as="p" variant="heading-small" weight="bold" color="gray-normal" className="mb-4">
          Table of contents
        </Text>
        <ul className="flex flex-col border-l border-border-gray-subtle">
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={clsx("block py-2 pl-4 border-l-2 -ml-px transition-colors", isActive ? "border-brand" : "border-transparent")}
                >
                  <Text
                    as="span"
                    variant="body-small"
                    weight={isActive ? "semibold" : "normal"}
                    color={isActive ? "primary-normal" : "gray-muted"}
                  >
                    {index + 1}. {item.text}
                  </Text>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
