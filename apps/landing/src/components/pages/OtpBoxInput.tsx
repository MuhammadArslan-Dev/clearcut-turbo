"use client";

import { useRef, useEffect, useState } from "react";

// Same colour tokens @clearcut/ui/main-input uses, so this reads as the same
// input style, just laid out as separate boxes instead of one field.
const COLORS = {
  gray: "color-mix(in srgb, var(--color-gray-blue) 18%, transparent)",
  lightGray: "color-mix(in srgb, var(--color-gray-blue) 12%, transparent)",
  primary: "var(--color-brand)",
  lightPrimary: "var(--color-input-primary-soft)",
  error: "var(--color-input-error)",
  lightError: "var(--color-input-error-soft)",
};

interface OtpBoxInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Controlled multi-box OTP input. `value` is the single source of truth (a
 * digit string up to `length` long) — this lets external updates, like
 * useWebOtpAutofill's setOtp(code), just work: the boxes re-render from the
 * new value with no extra wiring. Each box only ever reports the FULL
 * resulting string via onChange; it never manages its own independent state.
 */
export default function OtpBoxInput({
  length,
  value,
  onChange,
  error = false,
  disabled = false,
  autoFocus = false,
}: OtpBoxInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDigitAt = (index: number, digit: string) => {
    const chars = value.split("");
    chars[index] = digit;
    // join() treats holes (from setting an index past the string's current
    // length) as empty string, which is what we want for the normal
    // left-to-right/backspace flow. A box clicked directly out of order
    // (skipping earlier empty boxes) collapses to the next filled position
    // rather than preserving a gap — `value` is a plain digit string
    // (matching the existing `otp` state and what the API expects), and
    // representing gaps would mean sending non-digit placeholder characters
    // to authApi.verifyOtp.
    onChange(chars.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);

    if (!digit) {
      // Cleared via selection/delete rather than Backspace-on-empty.
      setDigitAt(index, "");
      return;
    }

    setDigitAt(index, digit);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        // Box has a digit — clear just this box, stay put (matches native
        // single-input backspace behaviour).
        setDigitAt(index, "");
      } else if (index > 0) {
        // Already empty — jump back and clear the previous box too, so
        // repeated Backspace walks left deleting one digit at a time.
        setDigitAt(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;

    // Pasting an OTP replaces the whole value — that's the only sane
    // behaviour for a paste, regardless of which box triggered it.
    onChange(digits);
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => {
        const filled = Boolean(value[i]);
        const focused = focusedIndex === i;

        const borderColor = error ? COLORS.error : focused ? COLORS.primary : COLORS.gray;
        const backgroundColor = error ? COLORS.lightError : focused ? COLORS.lightPrimary : COLORS.lightGray;

        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            autoComplete="one-time-code"
            value={value[i] ?? ""}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
            className="w-12 h-12 text-center body-large !font-semibold text-[var(--color-text-gray-normal)] outline-none border-b-2 shadow-sm transition-colors disabled:opacity-50"
            style={{ borderBottomColor: borderColor, backgroundColor }}
            aria-label={`OTP digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
