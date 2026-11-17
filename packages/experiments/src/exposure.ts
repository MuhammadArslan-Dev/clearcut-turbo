// What happens when GrowthBook puts a visitor into an experiment (CC-192): one Amplitude `$exposure` event
// ({ flag_key, variant }) and the user property `exp_<flag_key>`, so any existing Amplitude funnel can be broken down
// by variant. The apps pass their own Amplitude functions (same pattern as @clearcut/auth).

export type ExposureSink = {
  track: (eventName: string, properties: Record<string, unknown>) => void;
  setUserProperty: (key: string, value: string) => void;
};

export const EXPOSURE_EVENT = "$exposure";

/** Never throws (it runs inside GrowthBook's evaluation, which must not break a render) and reports each variant once. */
export function createTrackingCallback(sink: ExposureSink) {
  const seen = new Set<string>();
  return (experiment: { key: string }, result: { key: string }) => {
    try {
      const signature = `${experiment.key}:${result.key}`;
      if (seen.has(signature)) return;
      seen.add(signature);
      sink.track(EXPOSURE_EVENT, { flag_key: experiment.key, variant: String(result.key) });
      sink.setUserProperty(`exp_${experiment.key}`, String(result.key));
    } catch {
      /* analytics must never break the page */
    }
  };
}
