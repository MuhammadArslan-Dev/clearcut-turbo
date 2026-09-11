import React from "react";
import Text from "@clearcut/ui/text";
import AccordionIcon from "../icons/accordion-icon";

export type AccordionItem = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
  defaultOpenId?: string;
  /** Fired by the browser's native `toggle` event when an item opens — used
   *  by callers that keep the URL hash in sync with the open question. This
   *  is an observer only: it never drives open/close, the <details> element
   *  and its native `name` grouping (exclusive accordion, Baseline 2023)
   *  already do that with zero JS. */
  onOpenChange?: (id: string | null) => void;
};

// No client component needed — the whole open/close/exclusive-group
// interaction is native <details>/<summary> + CSS. `onOpenChange` is the
// only JS involved, and it's a side-effect listener, not a state driver.
export default function Accordion({ items, defaultOpenId, onOpenChange }: Props) {
  const groupName = React.useId();

  return (
    <div className="flex flex-col gap-3 max-w-[900px] mx-auto w-full">
      {items.map((item) => (
        <details
          key={item.id}
          id={item.id}
          name={groupName}
          open={item.id === defaultOpenId}
          onToggle={(e) =>
            onOpenChange?.(e.currentTarget.open ? item.id : null)
          }
          className="group rounded-xl border-2 border-gray-200 open:border-brand px-5 py-4 bg-white scroll-mt-24 transition-colors duration-200"
        >
          {/* HEADER — native disclosure triangle removed, replaced by the
              chevron icon below, rotated purely via the `open:`/`group-open:`
              CSS variants (no JS animation driver). */}
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
              height measurement, no mount/unmount step. */}
          <div className="grid grid-rows-[0fr] group-open:grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-in-out opacity-0 group-open:opacity-100">
            <div className="overflow-hidden">
              <Content>{item.content}</Content>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------- Content helpers ---------- */
export function renderTextWithBreaks(
  content: React.ReactNode,
): React.ReactNode {
  if (typeof content !== "string") return content;

  return content.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {index > 0 && <br />}
      {line}
    </React.Fragment>
  ));
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
