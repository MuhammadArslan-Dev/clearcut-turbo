export interface MetaGeoData {
  ct?: string;
  st?: string;
  zp?: string;
  country: string;
}

const CACHE_KEY = "meta_geo_data";
// One budget for the WHOLE lookup (all providers together). Callers await this
// right before a Meta event that is often followed by a hard navigation
// (StartTrial, Purchase, Lead before redirect), so it must stay short. The
// old per-provider 2.5s timeouts, run one after another, could hold an event
// for ~5s and lose it to the redirect.
const GEO_TOTAL_BUDGET_MS = 1500;

/**
 * Synchronous read of the geo data cached earlier in this session, or null.
 * Use it where waiting is not acceptable (e.g. PageView on page load) and fall
 * back to sending without city/state/zip.
 */
export function readCachedMetaGeoData(): MetaGeoData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as MetaGeoData) : null;
  } catch {
    return null;
  }
}

/**
 * Meta's advanced-matching city/state/zip come from IP geolocation — none of
 * the apps ask users for their address. Country is hardcoded ("in") since
 * every exam here (CTET/HTET/etc.) targets India-only learners, so no lookup
 * is needed for that one field. Cached in sessionStorage so repeated calls
 * within a visit (e.g. multiple Meta events on one page) don't re-fetch.
 *
 * Formatting follows Meta's advanced-matching docs: `ct` lowercase with
 * spaces removed, `st` lowercase two-letter code (ipapi's `region_code`, not
 * the full `region` name), `zp` as a string, `country` lowercase two-letter.
 * Never rejects: on timeout/block it resolves with country only.
 */
export async function getMetaGeoData(): Promise<MetaGeoData> {
  if (typeof window === "undefined") return { country: "in" };

  const cached = readCachedMetaGeoData();
  if (cached) return cached;

  const data: MetaGeoData = { country: "in" };
  const deadline = Date.now() + GEO_TOTAL_BUDGET_MS;

  // Both providers are free and keyless. ipwho.is is primary (open CORS, not
  // behind a bot challenge); ipapi.co is kept as a fallback — it returns 403
  // from some networks, so it can't be the only source.
  const providers: Array<{
    url: string;
    pick: (json: Record<string, unknown>) => { city?: string; region?: string; postal?: string };
  }> = [
    {
      url: "https://ipwho.is/",
      pick: (j) => (j.success === false ? {} : { city: j.city as string, region: j.region_code as string, postal: j.postal as string }),
    },
    {
      url: "https://ipapi.co/json/",
      pick: (j) => ({ city: j.city as string, region: j.region_code as string, postal: j.postal as string }),
    },
  ];

  for (const provider of providers) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      const res = await fetch(provider.url, { signal: controller.signal });
      if (!res.ok) continue;
      const { city, region, postal } = provider.pick(await res.json());
      if (city) data.ct = String(city).toLowerCase().replace(/\s+/g, "");
      if (region) data.st = String(region).toLowerCase();
      if (postal) data.zp = String(postal);
      if (data.ct || data.st || data.zp) break;
    } catch {
      // Timed out or blocked — try the next provider (if budget is left)
    } finally {
      clearTimeout(timer);
    }
  }

  // Only cache a successful lookup; a timeout/block shouldn't pin
  // country-only data for the whole session.
  if (data.ct || data.st || data.zp) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }

  return data;
}
