"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import AccordionIcon from "../icons/accordion-icon";
import Text from "@clearcut/ui/text";
export type AccordionItem = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
  defaultOpenId?: string;
  /** Called with the newly-opened item's id (or null when closed). Used by
   *  callers that keep the open item in sync with the URL hash. */
  onOpenChange?: (id: string | null) => void;
};

export default function Accordion({ items, defaultOpenId, onOpenChange }: Props) {
  const [openId, setOpenId] = React.useState<string | null>(
    defaultOpenId ?? null,
  );

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    onOpenChange?.(next);
  };

  return (
    <div className="flex flex-col gap-3 max-w-[900px] mx-auto w-full">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <motion.div
            key={item.id}
            id={item.id}
            layout
            className={clsx(
              "rounded-xl border-2 px-5 py-4 cursor-pointer bg-white scroll-mt-24",
              isOpen ? "border-brand" : "border-gray-200",
            )}
            onClick={() => toggle(item.id)}
          >
            {/* HEADER */}
            <button
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <Text as="p" variant="heading-small" weight="semibold">
                {item.title}
              </Text>

              {/* Chevron */}
              <motion.span
                animate={{ rotate: isOpen ? 0 : 180 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="heading-small !font-semibold"
              >
                <AccordionIcon />
              </motion.span>
            </button>

            {/* CONTENT */}
            <AnimatePresence initial={false}>
              {isOpen && <Content>{item.content}</Content>}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- Smooth Content Component ---------- */
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
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    if (ref.current) {
      setHeight(ref.current.scrollHeight);
    }
  }, [children]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{
        height: {
          type: "spring",
          stiffness: 120,
          damping: 18,
        },
        opacity: { duration: 0.2 },
      }}
      style={{ overflow: "hidden" }}
    >
      <div ref={ref} className="pt-2">
        <Text as="div" variant="body-medium" className="whitespace-pre-line">
          {children}
        </Text>
      </div>
    </motion.div>
  );
}
