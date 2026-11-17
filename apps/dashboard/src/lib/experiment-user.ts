// CC-192: who the logged-in visitor is, for experiment targeting. Deliberately tiny and free of the GrowthBook SDK so that
// AnalyticsProvider can import it without pulling the SDK into every dashboard page; the SDK only loads where an
// experiment element is mounted (see ./experiments.ts).
export type ExperimentUser = { user_id?: string; is_logged_in?: boolean; is_paid?: boolean; plan_type?: string };

let current: ExperimentUser = {};
const listeners = new Set<(user: ExperimentUser) => void>();

export function setExperimentUser(next: ExperimentUser): void {
  current = { ...current, ...next };
  listeners.forEach((l) => l(current));
}

export function getExperimentUser(): ExperimentUser {
  return current;
}

/** Subscribes; returns the unsubscribe function. */
export function onExperimentUserChange(listener: (user: ExperimentUser) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
