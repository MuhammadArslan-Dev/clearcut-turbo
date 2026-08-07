"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * Shared Select — a replacement for `@mui/joy/Select` as it is actually used in
 * this monorepo (exactly one call site: apps/dashboard ProfileCard gender field).
 *
 * Every value below was read off a live Joy Select with getComputedStyle, not
 * taken from Joy's source. Measured for size="md" variant="outlined":
 *
 *   trigger   flex, items-center, min-height 36px, padding 3px 12px,
 *             border 1px solid rgb(205,215,225), radius 6px,
 *             background rgb(251,252,254), color rgb(50,56,62),
 *             font 16px/24px w400, cursor pointer,
 *             box-shadow rgba(21,21,21,.08) 0 1px 2px 0
 *   danger    border rgb(217,45,32), color rgb(145,32,24)
 *   indicator 20x20
 *   listbox   padding 6px 0, border 1px solid rgb(205,215,225), radius 6px,
 *             background #fff, z-index 1000, overflow-y auto,
 *             box-shadow rgba(21,21,21,.08) 0 2px 8px -2px,
 *                        rgba(21,21,21,.08) 0 6px 12px -2px
 *   option    padding 4px 12px, min-height 36px, font 16px/24px w400,
 *             color rgb(50,56,62), selected background rgb(221,231,238)
 *
 * ─── Why Radix rather than a hand-rolled listbox ────────────────────────────
 * Joy's Select is a full ARIA listbox widget, measured at runtime as:
 *   trigger  BUTTON role=combobox + aria-expanded + aria-controls
 *            (no aria-haspopup, no aria-activedescendant)
 *   focus    moves INTO the list on open (document.activeElement === LI[option])
 *   options  role=option + aria-selected + roving tabindex (0 / -1)
 *   listbox  role=listbox tabindex=-1, portaled to <body>, z-index 1000
 * Radix Select implements the same model (real DOM focus + roving tabindex,
 * portaled content, role=combobox trigger). Re-implementing that by hand would
 * mean re-deriving keyboard and focus management that is easy to get subtly
 * wrong, so the accessible behaviour is delegated and only the styling is ours.
 *
 * ─── Deliberately NOT implemented ───────────────────────────────────────────
 * `variant`, `color` (beyond the boolean `error`), `size`, `multiple`,
 * `disabled`, `defaultValue`, `renderValue`, decorators, grouping, search.
 * The audit found the single call site uses only value / onChange / placeholder /
 * size="md" / color=danger|neutral, so anything else would be invented API.
 *
 * ─── Joy value semantics ────────────────────────────────────────────────────
 * The call site models "nothing selected" as the empty string (`draft.gender || ""`).
 * Radix reserves "" (an Item may not use it) and expects `undefined` for no
 * selection, so `value` is mapped here rather than changed at the call site.
 */

// Colours and shadows come from @clearcut/design-tokens, not from literals:
// hardcoding the measured Joy values here put 21 raw colours into packages/ui and
// tripped the colour-governance baseline (measured: packages/ui 0 -> 21).
const TRIGGER_BASE =
  "flex items-center justify-between w-full box-border cursor-pointer " +
  "min-h-[36px] py-[3px] px-[12px] rounded-[6px] " +
  "border border-solid bg-[var(--color-control-surface)] " +
  "text-[16px] leading-[24px] font-normal " +
  "shadow-[var(--shadow-control)]";

export interface SelectProps {
  /** Controlled value. `""` means "no selection" (Joy semantics). */
  value?: string;
  /** Fires with the newly selected value. */
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Replaces Joy's `color="danger" | "neutral"`. */
  error?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Forwarded to the trigger so a label can point at it if one ever exists. */
  id?: string;
}

function Select({ value, onValueChange, placeholder, error = false, children, className, id }: SelectProps) {
  return (
    <SelectPrimitive.Root
      // "" is not a valid Radix value; undefined is how Radix says "unset",
      // which is also what makes the placeholder render.
      value={value === "" ? undefined : value}
      onValueChange={onValueChange}
    >
      <SelectPrimitive.Trigger
        id={id}
        data-slot="select-trigger"
        className={cn(
          TRIGGER_BASE,
          error
            ? "border-[var(--color-danger)] text-[var(--color-danger-strong)]"
            : "border-[var(--color-control-border)] text-[var(--color-neutral-strong)]",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon
          data-slot="select-indicator"
          className="flex items-center justify-center w-[20px] h-[20px] shrink-0"
        >
          {/* Same glyph geometry as Joy's indicator slot (20x20 box, 1em chevron). */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="select-listbox"
          position="popper"
          sideOffset={4}
          className={
            "z-[1000] overflow-y-auto rounded-[6px] border border-solid " +
            "border-[var(--color-control-border)] bg-white py-[6px] " +
            "text-[16px] leading-[24px] " +
            "shadow-[var(--shadow-control-popup)] " +
            // Joy sizes the popup to the trigger; Radix exposes that as a var.
            "w-[var(--radix-select-trigger-width)] " +
            "max-h-[var(--radix-select-content-available-height)]"
          }
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export interface SelectOptionProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function SelectOption({ value, children, className }: SelectOptionProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      data-slot="select-option"
      className={cn(
        "flex items-center min-h-[36px] py-[4px] px-[12px] cursor-pointer outline-none " +
          "text-[16px] leading-[24px] font-normal text-[var(--color-neutral-strong)] " +
          // Joy paints the active/selected row --color-control-selected; Radix
          // exposes the keyboard-active row as data-highlighted.
          "data-[highlighted]:bg-[var(--color-control-selected)] " +
          "data-[state=checked]:bg-[var(--color-control-selected)]",
        className,
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectOption };
export default Select;
