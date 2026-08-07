export function formatDurationSmart(input: string): string {
  const parts = input.split(":").map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid time format: ${input}`);
  }

  let [h, m, s] = parts;

  // Normalize overflow (optional but safe)
  m += Math.floor(s / 60);
  s = s % 60;

  h += Math.floor(m / 60);
  m = m % 60;

  // Case 1: Hours present → full H:MM:SS
  if (h > 0) {
    return [
      String(h).padStart(2, "0"),
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0"),
    ].join(":") + " h";
  }

  // Case 2: Minutes present → MM:SS
  if (m > 0) {
    return [
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0"),
    ].join(":") + " min";
  }

  // Case 3: Only seconds
  return `${s} sec`;
}
