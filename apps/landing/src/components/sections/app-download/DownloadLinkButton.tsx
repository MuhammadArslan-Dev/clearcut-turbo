"use client";

import React from "react";
import { buttonVariants } from "@clearcut/ui/button";

/**
 * Plain `<a>` styled with `buttonVariants` instead of `Button`+`asChild` —
 * Button always wraps its children in an extra span alongside leftIcon's
 * span, so Radix Slot never gets the single child it requires (same
 * documented bug worked around in packages/ui/src/page-not-found.tsx).
 *
 * `buttonVariants` is exported from button.tsx, a "use client" module — a
 * Server Component can render a client *component*, but not call a plain
 * function exported from one, so this tiny wrapper needs its own "use
 * client" even though it has no interactivity beyond being a link.
 */
export default function DownloadLinkButton({
  href,
  icon,
  children,
  className,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "solid", color: "primary", size: "lg", className })}
      style={{ borderRadius: "50px" }}
    >
      {icon}
      {children}
    </a>
  );
}
