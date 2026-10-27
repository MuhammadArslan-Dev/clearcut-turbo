"use client";

import React from "react";

/**
 * "Looking for X? View Y" — a one-line pointer from one Profile tab to its
 * sibling, so the Payments and Subscriptions tabs (which now split the student's
 * purchases by kind rather than overlapping) each say where the other kind lives.
 *
 * A <button>, not a <Link>: the active tab is component state that is read from
 * the URL only once on mount (`useResponsiveTabs`), so changing `?tab=` alone
 * would not switch anything — the page's own `onTabChange` has to be called.
 * It renders nothing when no handler is supplied, so the tabs still work if
 * they are ever mounted somewhere that has no tab switcher.
 */
export default function SwitchTabLink({
  hint,
  label,
  onClick,
  className = "",
}: {
  hint: string;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  if (!onClick) return null;

  return (
    <p className={`body-small !font-normal text-surface-gray-muted ${className}`}>
      {hint}{" "}
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer font-semibold text-brand underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </button>
    </p>
  );
}
