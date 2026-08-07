// dateUtils.ts
// --------------------------------------------------
// Safe, reusable date & countdown utilities
// --------------------------------------------------

export type CountdownResult = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
};

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}


/**
 * Parses a formatted date string like "8 Feb, 2026"
 *
 * INPUT:
 *   dateStr (string | null | undefined)
 *
 * OUTPUT:
 *   Date | null
 *
 * BEHAVIOR:
 *   - Returns null if input is invalid
 *   - Safe against undefined / null / non-date strings
 */
export function parseFormattedDate(
    dateStr?: string | null
): Date | null {
    if (!dateStr || typeof dateStr !== "string") return null;

    const clean = dateStr.replace(",", "").trim();
    const date = new Date(clean);

    if (isNaN(date.getTime())) return null;

    return date;
}

/**
 * Calculates remaining time between now and a target date
 *
 * INPUT:
 *   targetDate (Date | null)
 *
 * OUTPUT:
 *   CountdownResult
 */
export function getTimeDiff(targetDate: Date | null): CountdownResult {
    if (!targetDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const diffMs = targetDate.getTime() - Date.now();

    if (diffMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    return {
        days: Math.floor(totalHours / 24),
        hours: totalHours % 24,
        minutes: totalMinutes % 60,
        seconds: totalSeconds % 60,
        expired: false,
    };
}

/**
 * Main helper for UI countdown
 *
 * INPUT:
 *   dateStr (string | null | undefined)
 *
 * OUTPUT:
 *   CountdownResult
 *
 * SAFE:
 *   - Never throws
 *   - Returns expired=true for invalid input
 */
export function getCountdownFromFormattedDate(
    dateStr?: string | null
): CountdownResult {
    const targetDate = parseFormattedDate(dateStr);
    return getTimeDiff(targetDate);
}
// utils/date/dateUtils.ts
export const getCountdownFromFormattedDate2 = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.max(target - now, 0);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
    );

    return { days, hours, minutes, seconds };
};


/**
 * True when a formatted exam date is real, parseable, and already behind us.
 *
 * Single source of truth for "is the countdown over?", shared by the countdown
 * widget (which hides itself) and by the layout (which must also drop the
 * wrapper divs around it). Without a shared helper the layout would have to
 * re-derive the same rule, and the two could drift.
 *
 * `getCountdownFromFormattedDate2` clamps to 0 rather than going negative, so it
 * cannot answer this question on its own — a passed date and a date exactly now
 * both read as all-zeros.
 *
 * Returns false for a missing date, for the sentinel "upcoming", and for
 * anything unparseable: those are "unknown", not "passed", and must not hide UI.
 */
export const isExamDatePassed = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    if (dateStr.toLowerCase() === "upcoming") return false;
    const target = new Date(dateStr).getTime();
    if (Number.isNaN(target)) return false;
    return target <= Date.now();
};
