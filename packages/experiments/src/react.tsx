"use client";
// React glue (CC-192). No provider: each app creates its own hooks once with `createExperimentsHooks`, so the GrowthBook
// SDK is only bundled and loaded on pages that actually contain an experiment element.
import { useEffect, useState, type ReactNode } from "react";
import type { ExperimentsClient } from "./client";

export type ExperimentsHooksOptions = {
  /** The app's lazy singleton; `null` when experiments are off (no key, or not a production host). */
  getClient: () => ExperimentsClient | null;
  /**
   * Build-time fact (an inlined NEXT_PUBLIC_* var), so it is the same on the server and in the browser.
   * false = no client key configured: nothing is hidden, nothing runs, the page is exactly as before.
   */
  configured: boolean;
};

export function createExperimentsHooks({ getClient, configured }: ExperimentsHooksOptions) {
  /**
   * Returns `control` until the assignment is known. It never swaps a value after it has settled (no flicker): if the
   * features arrive too late the visitor keeps control for this page view and the cache serves the next one.
   */
  function useExperimentValue<T extends string | number | boolean>(flagKey: string, control: T, enabled = true): { value: T; ready: boolean } {
    const active = configured && enabled;
    const [state, setState] = useState<{ value: T; ready: boolean }>({ value: control, ready: !active });

    useEffect(() => {
      if (!active) return;
      const client = getClient();
      if (!client) {
        setState({ value: control, ready: true });
        return;
      }
      let cancelled = false;
      const settle = () => {
        if (!cancelled) setState({ value: client.getValue(flagKey, control), ready: true });
      };
      client.ready.then(settle, settle);
      return () => {
        cancelled = true;
      };
    }, [active, flagKey, control]);

    return state;
  }

  /**
   * Text whose copy is decided by a GrowthBook string feature. While the assignment is unknown (<= the 500 ms init timeout)
   * the text is `visibility:hidden`, which keeps its space (no layout shift) and avoids showing control and then variant.
   * The copy is plain text, trimmed and length-limited; anything else falls back to control.
   */
  function ExperimentText({ flagKey, control, enabled = true, maxLength = 60 }: { flagKey: string; control: string; enabled?: boolean; maxLength?: number }): ReactNode {
    const { value, ready } = useExperimentValue(flagKey, control, enabled);
    const clean = typeof value === "string" ? value.trim() : "";
    const text = clean && clean.length <= maxLength ? clean : control;
    return (
      <span data-exp-flag={flagKey} style={ready ? undefined : { visibility: "hidden" }}>
        {text}
      </span>
    );
  }

  return { useExperimentValue, ExperimentText };
}
