// Framework-agnostic GrowthBook client (CC-192). Verified against @growthbook/growthbook 2.1.0 (installed type definitions):
// new GrowthBook({ apiHost, clientKey, attributes, trackingCallback }), init({ timeout }) -> { success, source, error? } that
// never throws on network errors, getFeatureValue(key, fallback) returns the fallback until features are loaded.
import { GrowthBook, type Attributes } from "@growthbook/growthbook";
import { cleanAttributes } from "./attributes";
import { createTrackingCallback, type ExposureSink } from "./exposure";
import type { FeaturesPayload } from "./payload";

export const DEFAULT_API_HOST = "https://cdn.growthbook.io";
/** The ticket's guardrail: a short fetch timeout, then control. Cached features (localStorage) resolve immediately. */
export const INIT_TIMEOUT_MS = 500;

export type ExperimentsConfig = { clientKey: string; apiHost: string; timeoutMs: number };

/**
 * `null` = experiments are OFF: no client key yet, or not a production host (localhost, previews, staging never enter an
 * experiment, same rule as analytics, CC-94). Everybody then gets control and nothing is fetched.
 */
export function resolveConfig(input: { clientKey?: string; apiHost?: string; allowedHere: boolean; timeoutMs?: number }): ExperimentsConfig | null {
  const clientKey = (input.clientKey ?? "").trim();
  if (!clientKey || !input.allowedHere) return null;
  return { clientKey, apiHost: (input.apiHost ?? "").trim() || DEFAULT_API_HOST, timeoutMs: input.timeoutMs ?? INIT_TIMEOUT_MS };
}

export type ReadyResult = { success: boolean; source: string; error?: Error };

export type ExperimentsClient = {
  readonly gb: GrowthBook;
  /** Resolves (never rejects) once features are loaded from cache/network, or after the timeout. */
  readonly ready: Promise<ReadyResult>;
  setAttributes: (partial: Record<string, unknown>) => void;
  /** The assigned value, or `control` while features are not loaded, the flag is missing/off, or the type differs. */
  getValue: <T extends string | number | boolean>(flagKey: string, control: T) => T;
};

export function createExperimentsClient(args: {
  config: ExperimentsConfig;
  attributes: Record<string, unknown>;
  sink: ExposureSink;
  /** Features fetched on the server (see ./payload). With it the SDK decides synchronously: no request, no timeout, no cache read. */
  payload?: FeaturesPayload | null;
}): ExperimentsClient {
  const gb = new GrowthBook({
    apiHost: args.config.apiHost,
    clientKey: args.config.clientKey,
    attributes: cleanAttributes(args.attributes) as Attributes,
    trackingCallback: createTrackingCallback(args.sink),
    enableDevMode: false,
  });

  const initFromNetwork = (): Promise<ReadyResult> =>
    gb.init({ timeout: args.config.timeoutMs }).then(
      (r) => ({ success: r.success, source: r.source, error: r.error }),
      (error: unknown) => ({ success: false, source: "error", error: error instanceof Error ? error : new Error(String(error)) }),
    );

  let ready: Promise<ReadyResult>;
  if (args.payload) {
    try {
      void gb.initSync({ payload: args.payload });
      ready = Promise.resolve({ success: true, source: "server-payload" });
    } catch {
      ready = initFromNetwork(); // a payload the SDK cannot use: behave as if there was none
    }
  } else {
    ready = initFromNetwork();
  }

  return {
    gb,
    ready,
    setAttributes: (partial) => {
      void gb.setAttributes({ ...gb.getAttributes(), ...cleanAttributes(partial) } as Attributes).catch(() => undefined);
    },
    getValue: <T extends string | number | boolean>(flagKey: string, control: T): T => {
      try {
        const value = gb.getFeatureValue(flagKey, control) as unknown;
        return typeof value === typeof control ? (value as T) : control;
      } catch {
        return control;
      }
    },
  };
}
