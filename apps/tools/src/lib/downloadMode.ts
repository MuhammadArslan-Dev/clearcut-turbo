// Which download behaviour a Tools image tool uses (phase 71 §12). Decided per
// exam / page by two independent Amplitude flags, `hard_gate` and `soft_gate`:
//
//   hard_gate  soft_gate   mode        Download tap does
//   OFF        OFF         legacy      saves the image at once (the behaviour before phase 68)
//   ON         OFF         hard_gate   OTP login first, then the file
//   OFF        ON          soft_gate   "Your image is ready!" choice (image only / image + free PDF)
//   ON         ON          legacy      INVALID configuration — fail-open, reported with `conflict`
//
// Both ON is a configuration mistake. The rule is explicit and documented:
// fall back to Legacy (a mistake must never block a download or silently pick
// a gate) and surface it (`download_mode_conflict` on the downloaded event, a
// console warning). Missing flags / failed evaluation (`null`) are Legacy too.

export type DownloadMode = "legacy" | "hard_gate" | "soft_gate";

export interface DownloadFlags {
  hard_gate: boolean;
  soft_gate: boolean;
}

export interface ResolvedDownloadMode {
  mode: DownloadMode;
  /** true only when both flags were ON (invalid state). */
  conflict: boolean;
}

export function resolveDownloadMode(flags: DownloadFlags | null | undefined): ResolvedDownloadMode {
  if (!flags) return { mode: "legacy", conflict: false };
  if (flags.hard_gate && flags.soft_gate) return { mode: "legacy", conflict: true };
  if (flags.hard_gate) return { mode: "hard_gate", conflict: false };
  if (flags.soft_gate) return { mode: "soft_gate", conflict: false };
  return { mode: "legacy", conflict: false };
}
