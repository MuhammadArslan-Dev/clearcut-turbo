import React from "react";
import AccordionIcon from "./icons/accordion-icon";
import Text from "@clearcut/ui/text";

export type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
  defaultOpenId?: string;
};

// No client component needed — the whole open/close/exclusive-group
// interaction is native <details>/<summary> + CSS (same pattern as
// apps/landing/src/components/shared/FAQAccordion.tsx, which this mirrors
// for visual/animation consistency across apps). Previously a "use client"
// component driving open state + the expand/collapse animation through
// framer-motion (useState, AnimatePresence, a layout-measuring effect) for
// behavior the browser already provides for free.
export default function Accordion({ items, defaultOpenId }: Props) {
  const groupName = React.useId();

  return (
    <div className="flex flex-col gap-3 max-w-[900px] mx-auto w-full">
      {items.map((item) => (
        <details
          key={item.id}
          id={item.id}
          name={groupName}
          open={item.id === defaultOpenId}
          className="group rounded-xl border-2 border-gray-200 open:border-brand px-5 py-4 bg-white transition-colors duration-200"
        >
          {/* HEADER — native disclosure triangle removed, replaced by the
              chevron icon below, rotated purely via the `group-open:` CSS
              variant (no JS animation driver). */}
          <summary className="list-none [&::-webkit-details-marker]:hidden w-full flex items-center justify-between gap-4 cursor-pointer">
            <Text as="p" variant="heading-small" weight="semibold">
              {item.title}
            </Text>

            <span className="heading-small !font-semibold shrink-0 rotate-180 transition-transform duration-300 ease-out group-open:rotate-0">
              <AccordionIcon />
            </span>
          </summary>

          {/* CONTENT — pure CSS grid-template-rows accordion (0fr <-> 1fr),
              keyed off the native [open] attribute via group-open:. No JS
              height measurement, no mount/unmount step.
              `starting:` (@starting-style) is required for the OPEN
              direction specifically: a closed <details>' non-summary
              children are `display: none` per the UA stylesheet, so on
              open the browser has no prior computed value to transition
              FROM and would otherwise snap straight to grid-rows-[1fr]
              instead of animating — @starting-style supplies that value.
              CLOSE doesn't need it (the element is already rendered with a
              real computed value the moment [open] is removed). */}
          <div className="grid grid-rows-[0fr] group-open:grid-rows-[1fr] group-open:starting:grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 ease-in-out opacity-0 group-open:opacity-100 group-open:starting:opacity-0">
            <div className="overflow-hidden">
              <Content>{item.content}</Content>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <Text as="div" variant="body-medium" className="whitespace-pre-line">
        {children}
      </Text>
    </div>
  );
}
