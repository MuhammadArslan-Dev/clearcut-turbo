// Server component: fetches the GrowthBook features payload once per 5 minutes (Next data cache) and passes it to the browser,
// so an experiment on this page is decided synchronously on the first view instead of waiting for a request from the visitor.
// Put it on every page that renders an experiment element. No client key (or an unusable answer) renders nothing, and the
// page then behaves exactly as before: browser fetch with the 500 ms guardrail, then control. See docs/phases/118.
import { fetchFeaturesPayload } from "@clearcut/experiments/payload";
import ExperimentsBootstrap from "./ExperimentsBootstrap";

export default async function ExperimentsPayload() {
  const clientKey = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY?.trim();
  if (!clientKey) return null;
  const payload = await fetchFeaturesPayload({ clientKey, apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST });
  return payload ? <ExperimentsBootstrap payload={payload} /> : null;
}
