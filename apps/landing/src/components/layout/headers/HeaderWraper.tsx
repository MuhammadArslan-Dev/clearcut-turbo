"use client";
import { useScrollShadow } from "@clearcut/hooks/use-scroll-shadow";
import clsx from "clsx";
import React from "react";

export default function HeaderWraper({
  children,
}: {
  children: React.ReactNode;
}) {
  const showShadow = useScrollShadow(10);
  return (
    <header
      className={clsx(
        "bg-white sticky top-0 z-[var(--z-header-elevated)] relative",
        showShadow ? "transition-shadow duration-300 shadow-md" : "",
      )}
    >
      {children}
    </header>
  );
}
