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

// A third flag, `second_download_gate` (CC-174, phase 121), turns on the mode of
// the same name: the first download is free; from the 2nd one, a visitor without
// a session verifies with OTP (and may consent to saving their photo & signature).
// It must be the ONLY flag ON. Together with either of the others it is the same
// invalid configuration as above (Legacy + conflict).
import { isOtpRequiredBeforeDownload } from "@/config/downloadVerification";

export type DownloadMode = "legacy" | "hard_gate" | "soft_gate" | "second_download_gate";

export interface DownloadFlags {
  hard_gate: boolean;
  soft_gate: boolean;
  /** Optional so an answer cached before phase 121 still reads as OFF. */
  second_download_gate?: boolean;
}

export interface ResolvedDownloadMode {
  mode: DownloadMode;
  /** true only when both flags were ON (invalid state). */
  conflict: boolean;
}

const MODES: readonly DownloadMode[] = ["legacy", "hard_gate", "soft_gate", "second_download_gate"];

/**
 * Local QA only: `localStorage["cc-tools-dev-download-mode"] = "second_download_gate"` forces a
 * mode on localhost / 127.0.0.1, so a gate can be tested without switching a production
 * Amplitude flag. Ignored on every other host.
 */
export function devForcedDownloadMode(hostname = typeof window === "undefined" ? "" : window.location.hostname): DownloadMode | null {
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return null;
  try {
    const value = window.localStorage.getItem("cc-tools-dev-download-mode");
    return value && (MODES as readonly string[]).includes(value) ? (value as DownloadMode) : null;
  } catch {
    return null;
  }
}

export function resolveDownloadMode(flags: DownloadFlags | null | undefined): ResolvedDownloadMode {
  if (!flags) return { mode: "legacy", conflict: false };
  const on = [flags.hard_gate, flags.soft_gate, Boolean(flags.second_download_gate)].filter(Boolean).length;
  if (on > 1) return { mode: "legacy", conflict: true };
  if (flags.second_download_gate) return { mode: "second_download_gate", conflict: false };
  if (flags.hard_gate) return { mode: "hard_gate", conflict: false };
  if (flags.soft_gate) return { mode: "soft_gate", conflict: false };
  return { mode: "legacy", conflict: false };
}

/** Where the mode of one download came from (sent as `download_mode_source` on the existing events). */
export type DownloadModeSource = "config" | "amplitude" | "dev_override";

export interface ResolvedDownloadModeFor extends ResolvedDownloadMode {
  source: DownloadModeSource;
}

/**
 * THE one place a Download tap's mode is decided (phase 127):
 *  1. an exam in config/downloadVerification.ts → always `hard_gate` (source `config`),
 *     whatever the flags or the dev override say;
 *  2. otherwise the localhost-only dev override, if set (source `dev_override`);
 *  3. otherwise the Amplitude flags, exactly as before (source `amplitude`).
 */
export function resolveDownloadModeFor(
  exam: string | null | undefined,
  flags: DownloadFlags | null | undefined,
  devForced: DownloadMode | null = null,
): ResolvedDownloadModeFor {
  if (isOtpRequiredBeforeDownload(exam)) return { mode: "hard_gate", conflict: false, source: "config" };
  if (devForced) return { mode: devForced, conflict: false, source: "dev_override" };
  return { ...resolveDownloadMode(flags), source: "amplitude" };
}
